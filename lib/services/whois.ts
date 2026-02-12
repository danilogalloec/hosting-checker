import whoiser from 'whoiser';
import { WhoisInfo } from '../types';
import { tryCatch } from '../utils/errorHandler';
import cache, { generateCacheKey, CacheTTL } from '../utils/cache';

/**
 * Obtener información WHOIS de un dominio
 */
export async function getWhoisInfo(domain: string): Promise<{
  success: boolean;
  data?: WhoisInfo;
  error?: string;
  cached?: boolean;
}> {
  const cacheKey = generateCacheKey('whois', domain);

  // Verificar caché
  const cached = cache.get<WhoisInfo>(cacheKey);
  if (cached) {
    return { success: true, data: cached, cached: true };
  }

  // Consultar WHOIS
  const result = await tryCatch(async () => {
    const whoisData = await whoiser(domain, {
      timeout: 10000,
      follow: 2,
    });

    return parseWhoisData(domain, whoisData);
  }, `Error fetching WHOIS for ${domain}`);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Guardar en caché
  cache.set(cacheKey, result.data, CacheTTL.WHOIS);

  return { success: true, data: result.data, cached: false };
}

/**
 * Parsear datos WHOIS (estructura varía por registrador)
 */
function parseWhoisData(domain: string, whoisData: any): WhoisInfo {
  // whoiser retorna un objeto con múltiples niveles
  // Intentar obtener el primer nivel de datos relevante
  const firstKey = Object.keys(whoisData)[0];
  const data = whoisData[firstKey] || {};

  // Función helper para extraer valor
  const getValue = (key: string): any => {
    if (Array.isArray(data[key])) {
      return data[key][0];
    }
    return data[key];
  };

  // Función helper para obtener array
  const getArray = (key: string): string[] => {
    if (Array.isArray(data[key])) {
      return data[key];
    }
    if (data[key]) {
      return [data[key]];
    }
    return [];
  };

  // Parsear fechas
  const parseDate = (dateStr: any): string | undefined => {
    if (!dateStr) return undefined;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString();
    } catch {
      return undefined;
    }
  };

  // Extraer nameservers
  const nameservers: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const ns = getValue(`Name Server ${i}`) || getValue(`name server ${i}`);
    if (ns && typeof ns === 'string') {
      nameservers.push(ns.toLowerCase().trim());
    }
  }
  // También buscar en array de nameservers
  const nsArray = data['Name Server'] || data['name server'] || data['nameserver'] || data['nserver'];
  if (nsArray) {
    const nsList = Array.isArray(nsArray) ? nsArray : [nsArray];
    nsList.forEach((ns: any) => {
      if (typeof ns === 'string' && !nameservers.includes(ns.toLowerCase())) {
        nameservers.push(ns.toLowerCase().trim());
      }
    });
  }

  return {
    domain,
    registrar: getValue('Registrar') || getValue('registrar') || undefined,
    registrarUrl: getValue('Registrar URL') || getValue('registrar url') || undefined,
    createdDate: parseDate(getValue('Creation Date') || getValue('created') || getValue('Created Date')),
    updatedDate: parseDate(getValue('Updated Date') || getValue('updated') || getValue('Modified Date')),
    expiryDate: parseDate(getValue('Expiry Date') || getValue('Registry Expiry Date') || getValue('expires')),
    status: getArray('Domain Status') || getArray('status') || undefined,
    nameservers: nameservers.length > 0 ? nameservers : undefined,
    dnssec: getValue('DNSSEC') || getValue('dnssec') || undefined,
    registrantOrganization: getValue('Registrant Organization') || getValue('registrant org') || undefined,
    registrantCountry: getValue('Registrant Country') || getValue('registrant country') || undefined,
    adminEmail: getValue('Admin Email') || getValue('admin email') || undefined,
    techEmail: getValue('Tech Email') || getValue('tech email') || undefined,
    raw: JSON.stringify(data, null, 2),
  };
}

/**
 * Calcular días hasta expiración
 */
export function getDaysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;

  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

/**
 * Verificar si un dominio está próximo a expirar
 */
export function isDomainExpiringSoon(expiryDate?: string, daysThreshold: number = 30): boolean {
  const days = getDaysUntilExpiry(expiryDate);
  return days !== null && days <= daysThreshold && days > 0;
}
