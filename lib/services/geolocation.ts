import axios from 'axios';
import { GeolocationInfo } from '../types';
import { tryCatch, ExternalAPIError } from '../utils/errorHandler';
import cache, { generateCacheKey, CacheTTL } from '../utils/cache';
import dns from 'dns/promises';

/**
 * Obtener información de geolocalización para un dominio
 */
export async function getGeolocation(domain: string): Promise<{
  success: boolean;
  data?: GeolocationInfo;
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
  const cacheKey = generateCacheKey('geo', ip);

  // Verificar caché
  const cached = cache.get<GeolocationInfo>(cacheKey);
  if (cached) {
    return { success: true, data: cached, cached: true };
  }

  // Consultar geolocalización
  const result = await getGeolocationByIP(ip);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Guardar en caché
  cache.set(cacheKey, result.data!, CacheTTL.GEO);

  return { success: true, data: result.data, cached: false };
}

/**
 * Obtener geolocalización por IP directamente
 */
export async function getGeolocationByIP(ip: string): Promise<{
  success: boolean;
  data?: GeolocationInfo;
  error?: string;
}> {
  const cacheKey = generateCacheKey('geo', ip);

  // Verificar caché
  const cached = cache.get<GeolocationInfo>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  // Intentar con ipapi.co (1k req/día gratis)
  const result = await tryCatch(async () => {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'HostingChecker/1.0',
      },
    });

    if (response.data.error) {
      throw new ExternalAPIError(response.data.reason || 'IP lookup failed', 'ipapi.co');
    }

    return parseIpapiResponse(ip, response.data);
  }, `Error fetching geolocation for IP ${ip}`);

  if (!result.success) {
    // Fallback: intentar con ipinfo.io si está disponible
    return await getGeolocationFromIPInfo(ip);
  }

  // Guardar en caché
  cache.set(cacheKey, result.data, CacheTTL.GEO);

  return { success: true, data: result.data };
}

/**
 * Fallback: ipinfo.io (requiere token para más de 50k/mes)
 */
async function getGeolocationFromIPInfo(ip: string): Promise<{
  success: boolean;
  data?: GeolocationInfo;
  error?: string;
}> {
  const token = process.env.IPINFO_TOKEN;

  if (!token) {
    return {
      success: false,
      error: 'Geolocation service unavailable (no API token)',
    };
  }

  const result = await tryCatch(async () => {
    const response = await axios.get(`https://ipinfo.io/${ip}/json?token=${token}`, {
      timeout: 5000,
    });

    return parseIPInfoResponse(ip, response.data);
  }, `Error fetching geolocation from ipinfo.io for IP ${ip}`);

  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

/**
 * Parsear respuesta de ipapi.co
 */
function parseIpapiResponse(ip: string, data: any): GeolocationInfo {
  // Parsear coordenadas
  const latitude = data.latitude ? parseFloat(data.latitude) : undefined;
  const longitude = data.longitude ? parseFloat(data.longitude) : undefined;

  return {
    ip,
    city: data.city || undefined,
    region: data.region || undefined,
    country: data.country_code || data.country || 'Unknown',
    countryName: data.country_name || undefined,
    countryCode: data.country_code || undefined,
    continent: data.continent_code || undefined,
    latitude: !isNaN(latitude!) ? latitude : undefined,
    longitude: !isNaN(longitude!) ? longitude : undefined,
    timezone: data.timezone || undefined,
    isp: data.org || undefined,
    org: data.org || undefined,
    as: data.asn || undefined,
    asName: data.org || undefined,
    postal: data.postal || undefined,
  };
}

/**
 * Parsear respuesta de ipinfo.io
 */
function parseIPInfoResponse(ip: string, data: any): GeolocationInfo {
  // Parsear coordenadas desde "loc" (formato: "lat,lng")
  let latitude: number | undefined;
  let longitude: number | undefined;

  if (data.loc) {
    const [lat, lng] = data.loc.split(',').map(parseFloat);
    if (!isNaN(lat) && !isNaN(lng)) {
      latitude = lat;
      longitude = lng;
    }
  }

  return {
    ip,
    city: data.city || undefined,
    region: data.region || undefined,
    country: data.country || 'Unknown',
    countryName: undefined,
    countryCode: data.country || undefined,
    latitude,
    longitude,
    timezone: data.timezone || undefined,
    isp: data.org || undefined,
    org: data.org || undefined,
    postal: data.postal || undefined,
  };
}

/**
 * Calcular distancia entre dos puntos geográficos (Haversine)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
