import axios from 'axios';
import { ReverseIPInfo } from '../types';
import { tryCatch } from '../utils/errorHandler';
import cache, { generateCacheKey, CacheTTL } from '../utils/cache';
import dns from 'dns/promises';

/**
 * Obtener dominios que comparten la misma IP (Reverse IP Lookup)
 */
export async function getReverseIP(domain: string): Promise<{
  success: boolean;
  data?: ReverseIPInfo;
  error?: string;
  cached?: boolean;
}> {
  // Primero resolver el dominio a IP
  const ipResult = await tryCatch(
    async () => {
      const addresses = await dns.resolve4(domain);
      return addresses[0];
    },
    `Error resolving domain ${domain} to IP`
  );

  if (!ipResult.success) {
    return { success: false, error: ipResult.error };
  }

  const ip = ipResult.data;
  const cacheKey = generateCacheKey('reverse-ip', ip);

  // Verificar caché
  const cached = cache.get<ReverseIPInfo>(cacheKey);
  if (cached) {
    return { success: true, data: cached, cached: true };
  }

  // Consultar Reverse IP
  const result = await getReverseIPByIP(ip);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Guardar en caché
  cache.set(cacheKey, result.data!, CacheTTL.REVERSE_IP);

  return { success: true, data: result.data, cached: false };
}

/**
 * Obtener Reverse IP por dirección IP directamente
 */
export async function getReverseIPByIP(ip: string): Promise<{
  success: boolean;
  data?: ReverseIPInfo;
  error?: string;
}> {
  const cacheKey = generateCacheKey('reverse-ip', ip);

  // Verificar caché
  const cached = cache.get<ReverseIPInfo>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  // Intentar con HackerTarget (500 req/día gratis)
  const hackerTargetResult = await getReverseIPFromHackerTarget(ip);

  if (hackerTargetResult.success) {
    // Guardar en caché
    cache.set(cacheKey, hackerTargetResult.data!, CacheTTL.REVERSE_IP);
    return hackerTargetResult;
  }

  // Si falla HackerTarget, retornar error
  return {
    success: false,
    error: hackerTargetResult.error || 'Reverse IP lookup failed',
  };
}

/**
 * Consultar HackerTarget API
 */
async function getReverseIPFromHackerTarget(ip: string): Promise<{
  success: boolean;
  data?: ReverseIPInfo;
  error?: string;
}> {
  const apiKey = process.env.HACKERTARGET_API_KEY;
  const baseUrl = 'https://api.hackertarget.com/reverseiplookup/';

  // URL con o sin API key
  const url = apiKey ? `${baseUrl}?q=${ip}&apikey=${apiKey}` : `${baseUrl}?q=${ip}`;

  const result = await tryCatch(async () => {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'HostingChecker/1.0',
      },
    });

    const data = response.data;

    // Verificar errores de HackerTarget
    if (typeof data === 'string') {
      if (data.includes('error')) {
        throw new Error(data);
      }

      if (data.includes('API count exceeded')) {
        throw new Error('API rate limit exceeded');
      }

      if (data.includes('No DNS records found') || data.includes('no results')) {
        // No hay otros dominios en esta IP (es normal)
        return {
          ip,
          totalDomains: 0,
          domains: [],
          limited: false,
          source: 'hackertarget',
        };
      }

      // Parsear dominios (uno por línea)
      const domains = data
        .split('\n')
        .map((d: string) => d.trim())
        .filter((d: string) => d && !d.includes('error'));

      return {
        ip,
        totalDomains: domains.length,
        domains: domains.slice(0, 100), // Limitar a 100 para no saturar
        limited: domains.length > 100,
        source: 'hackertarget',
      };
    }

    throw new Error('Invalid response format');
  }, `Error fetching reverse IP from HackerTarget for ${ip}`);

  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

// Helper functions moved to lib/utils/helpers.ts to avoid client-side imports
