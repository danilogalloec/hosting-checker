import { CacheEntry, CacheStats } from '../types';

/**
 * Sistema de caché en memoria con TTL (Time To Live)
 * Soporta diferentes tiempos de expiración para cada tipo de dato
 */
class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private stats: { hits: number; misses: number };
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0 };
    this.cleanupInterval = null;

    // Iniciar limpieza automática cada 5 minutos
    this.startCleanup();
  }

  /**
   * Obtener valor del caché
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar si expiró
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Guardar valor en caché
   */
  set<T>(key: string, data: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    this.cache.set(key, entry);
  }

  /**
   * Eliminar valor del caché
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Verificar si una clave existe y está válida
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Limpiar entradas expiradas
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Limpiar todo el caché
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Obtener todas las claves
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Iniciar limpieza automática
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const cleaned = this.cleanup();
      if (cleaned > 0) {
        console.log(`[Cache] Cleaned ${cleaned} expired entries`);
      }
    }, 5 * 60 * 1000); // 5 minutos
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
const cache = new CacheManager();

/**
 * Helper function para generar claves de caché consistentes
 */
export function generateCacheKey(prefix: string, ...params: any[]): string {
  return `${prefix}:${params.join(':')}`.toLowerCase();
}

/**
 * TTL defaults (en segundos)
 */
export const CacheTTL = {
  WHOIS: parseInt(process.env.CACHE_TTL_WHOIS || '86400'), // 24 horas
  GEO: parseInt(process.env.CACHE_TTL_GEO || '604800'), // 7 días
  REVERSE_IP: parseInt(process.env.CACHE_TTL_REVERSE_IP || '3600'), // 1 hora
  HEALTH: parseInt(process.env.CACHE_TTL_HEALTH || '300'), // 5 minutos
  DNS_ANALYSIS: parseInt(process.env.CACHE_TTL_DNS_ANALYSIS || '1800'), // 30 minutos
};

export default cache;
