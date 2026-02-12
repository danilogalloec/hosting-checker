import { RateLimitInfo } from '../types';

/**
 * Sistema de Rate Limiting por IP
 * Limita el número de requests por ventana de tiempo
 */
class RateLimiter {
  private requests: Map<string, RateLimitInfo>;
  private maxRequests: number;
  private windowMs: number;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.requests = new Map();
    this.maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '10');
    this.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minuto
    this.cleanupInterval = null;

    // Iniciar limpieza automática cada minuto
    this.startCleanup();
  }

  /**
   * Verificar si una IP puede hacer una request
   */
  check(ip: string): { allowed: boolean; info: RateLimitInfo } {
    const now = Date.now();
    let info = this.requests.get(ip);

    // Si no existe o la ventana expiró, crear nueva entrada
    if (!info || now - info.windowStart > this.windowMs) {
      info = {
        ip,
        requests: 1,
        windowStart: now,
        blocked: false,
      };
      this.requests.set(ip, info);
      return { allowed: true, info };
    }

    // Incrementar contador
    info.requests++;

    // Verificar si excedió el límite
    if (info.requests > this.maxRequests) {
      info.blocked = true;
      this.requests.set(ip, info);
      return { allowed: false, info };
    }

    this.requests.set(ip, info);
    return { allowed: true, info };
  }

  /**
   * Obtener información de rate limit para una IP
   */
  getInfo(ip: string): RateLimitInfo | null {
    return this.requests.get(ip) || null;
  }

  /**
   * Resetear contador para una IP
   */
  reset(ip: string): void {
    this.requests.delete(ip);
  }

  /**
   * Limpiar entradas expiradas
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [ip, info] of this.requests.entries()) {
      if (now - info.windowStart > this.windowMs) {
        this.requests.delete(ip);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Limpiar todos los registros
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    const now = Date.now();
    let activeIPs = 0;
    let blockedIPs = 0;
    let totalRequests = 0;

    for (const [ip, info] of this.requests.entries()) {
      if (now - info.windowStart <= this.windowMs) {
        activeIPs++;
        totalRequests += info.requests;
        if (info.blocked) blockedIPs++;
      }
    }

    return {
      activeIPs,
      blockedIPs,
      totalRequests,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
    };
  }

  /**
   * Iniciar limpieza automática
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const cleaned = this.cleanup();
      if (cleaned > 0) {
        console.log(`[RateLimit] Cleaned ${cleaned} expired entries`);
      }
    }, 60 * 1000); // 1 minuto
  }

  /**
   * Detener limpieza automática
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Helper function para extraer IP del request
 */
export function getClientIP(request: Request): string {
  // Intentar obtener IP real desde headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback a IP de conexión (no disponible en Edge)
  return 'unknown';
}

/**
 * Middleware helper para Next.js API Routes
 */
export async function checkRateLimit(request: Request): Promise<{
  allowed: boolean;
  remaining: number;
  reset: number;
  info: RateLimitInfo;
}> {
  const ip = getClientIP(request);
  const { allowed, info } = rateLimiter.check(ip);

  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '10');
  const remaining = Math.max(0, maxRequests - info.requests);
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
  const reset = Math.ceil((info.windowStart + windowMs) / 1000);

  return {
    allowed,
    remaining,
    reset,
    info,
  };
}

/**
 * Crear headers de rate limit para la response
 */
export function createRateLimitHeaders(
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': process.env.RATE_LIMIT_MAX || '10',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };
}

export default rateLimiter;
