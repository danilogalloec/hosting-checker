import { HealthCheckInfo } from '../types';
import { tryCatch } from '../utils/errorHandler';
import cache, { generateCacheKey, CacheTTL } from '../utils/cache';
import https from 'https';
import http from 'http';
import { performance } from 'perf_hooks';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

/**
 * Realizar health check completo de un dominio
 */
export async function getHealthCheck(domain: string): Promise<{
  success: boolean;
  data?: HealthCheckInfo;
  error?: string;
  cached?: boolean;
}> {
  const cacheKey = generateCacheKey('health', domain);

  // Verificar caché
  const cached = cache.get<HealthCheckInfo>(cacheKey);
  if (cached) {
    return { success: true, data: cached, cached: true };
  }

  // Realizar health check
  const result = await performHealthCheck(domain);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Guardar en caché (TTL corto: 5 minutos)
  cache.set(cacheKey, result.data, CacheTTL.HEALTH);

  return { success: true, data: result.data, cached: false };
}

/**
 * Realizar health check completo
 */
async function performHealthCheck(domain: string): Promise<{
  success: boolean;
  data?: HealthCheckInfo;
  error?: string;
}> {
  const result = await tryCatch(async () => {
    // Intentar HTTPS primero
    let httpsResult = await checkHTTPS(domain);

    // Si HTTPS falla, intentar HTTP
    if (httpsResult.status === 'error' || httpsResult.status === 'offline') {
      const httpResult = await checkHTTP(domain);

      // Si HTTP funciona pero HTTPS no, usar HTTP
      if (httpResult.status === 'online') {
        return httpResult;
      }
    }

    // Intentar ping si HTTP/HTTPS fallan
    if (httpsResult.status === 'offline' || httpsResult.status === 'error') {
      const pingTime = await pingDomain(domain);
      if (pingTime !== null) {
        httpsResult.pingTime = pingTime;
      }
    }

    return httpsResult;
  }, `Error performing health check for ${domain}`);

  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

/**
 * Verificar HTTPS
 */
async function checkHTTPS(domain: string): Promise<HealthCheckInfo> {
  const url = `https://${domain}`;
  const startTime = performance.now();

  return new Promise((resolve) => {
    const timeoutDuration = 10000; // 10 segundos
    let responded = false;

    const timeout = setTimeout(() => {
      if (!responded) {
        responded = true;
        resolve({
          domain,
          url,
          status: 'error',
          ssl: { enabled: false },
          error: 'Connection timeout',
        });
      }
    }, timeoutDuration);

    const req = https.get(url, { timeout: timeoutDuration }, (res) => {
      if (responded) return;
      responded = true;
      clearTimeout(timeout);

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Obtener certificado SSL
      const socket: any = res.socket;
      const cert = socket?.getPeerCertificate();

      let sslInfo: HealthCheckInfo['ssl'] = { enabled: true };

      if (cert && cert.valid_from) {
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysUntilExpiry = Math.ceil(
          (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        sslInfo = {
          enabled: true,
          valid: now >= validFrom && now <= validTo,
          issuer: cert.issuer?.O || cert.issuer?.CN || undefined,
          validFrom: validFrom.toISOString(),
          validTo: validTo.toISOString(),
          daysUntilExpiry,
        };
      }

      const serverHeader = res.headers.server;
      resolve({
        domain,
        url,
        status: res.statusCode && res.statusCode < 500 ? 'online' : 'offline',
        httpStatus: res.statusCode,
        responseTime,
        ssl: sslInfo,
        redirects: 0,
        finalUrl: url,
        serverHeader: Array.isArray(serverHeader) ? serverHeader[0] : serverHeader,
      });
    });

    req.on('error', (err) => {
      if (responded) return;
      responded = true;
      clearTimeout(timeout);

      resolve({
        domain,
        url,
        status: 'error',
        ssl: { enabled: false },
        error: err.message,
      });
    });
  });
}

/**
 * Verificar HTTP
 */
async function checkHTTP(domain: string): Promise<HealthCheckInfo> {
  const url = `http://${domain}`;
  const startTime = performance.now();

  return new Promise((resolve) => {
    const timeoutDuration = 10000;
    let responded = false;

    const timeout = setTimeout(() => {
      if (!responded) {
        responded = true;
        resolve({
          domain,
          url,
          status: 'error',
          ssl: { enabled: false },
          error: 'Connection timeout',
        });
      }
    }, timeoutDuration);

    const req = http.get(url, { timeout: timeoutDuration }, (res) => {
      if (responded) return;
      responded = true;
      clearTimeout(timeout);

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      const serverHeader = res.headers.server;

      resolve({
        domain,
        url,
        status: res.statusCode && res.statusCode < 500 ? 'online' : 'offline',
        httpStatus: res.statusCode,
        responseTime,
        ssl: { enabled: false },
        redirects: 0,
        finalUrl: url,
        serverHeader: Array.isArray(serverHeader) ? serverHeader[0] : serverHeader,
      });
    });

    req.on('error', (err) => {
      if (responded) return;
      responded = true;
      clearTimeout(timeout);

      resolve({
        domain,
        url,
        status: 'error',
        ssl: { enabled: false },
        error: err.message,
      });
    });
  });
}

/**
 * Realizar ping a dominio
 */
async function pingDomain(domain: string): Promise<number | null> {
  try {
    // En Linux/Mac: ping -c 1 -W 5 domain
    // En Windows: ping -n 1 -w 5000 domain
    const isWindows = process.platform === 'win32';
    const command = isWindows
      ? `ping -n 1 -w 5000 ${domain}`
      : `ping -c 1 -W 5 ${domain}`;

    const { stdout } = await execPromise(command);

    // Parsear tiempo de respuesta
    const timeMatch = stdout.match(/time[=<](\d+(?:\.\d+)?)\s*ms/i);
    if (timeMatch) {
      return parseFloat(timeMatch[1]);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Calcular uptime score basado en el health check
 */
export function calculateHealthScore(health: HealthCheckInfo): number {
  let score = 0;

  // Status (40 puntos)
  if (health.status === 'online') score += 40;
  else if (health.status === 'offline') score += 20;

  // SSL (30 puntos)
  if (health.ssl.enabled) {
    score += 15;
    if (health.ssl.valid) score += 15;
  }

  // Response time (30 puntos)
  if (health.responseTime) {
    if (health.responseTime < 200) score += 30;
    else if (health.responseTime < 500) score += 25;
    else if (health.responseTime < 1000) score += 20;
    else if (health.responseTime < 2000) score += 15;
    else score += 10;
  }

  return Math.min(100, score);
}
