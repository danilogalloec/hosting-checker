import { z } from 'zod';

/**
 * Schema de validación para dominio
 */
export const DomainSchema = z.string()
  .min(1, 'Domain is required')
  .max(255, 'Domain too long')
  .regex(
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    'Invalid domain format'
  )
  .transform((domain) => domain.toLowerCase().trim());

/**
 * Schema para búsqueda de dominio (API)
 */
export const DomainSearchSchema = z.object({
  domain: DomainSchema,
});

/**
 * Validar formato de dominio
 */
export function isValidDomain(domain: string): boolean {
  try {
    DomainSchema.parse(domain);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizar dominio (remover protocolo, www, etc.)
 */
export function sanitizeDomain(input: string): string {
  let domain = input.trim().toLowerCase();

  // Remover protocolo
  domain = domain.replace(/^https?:\/\//, '');

  // Remover www.
  domain = domain.replace(/^www\./, '');

  // Remover path, query, hash
  domain = domain.split('/')[0];
  domain = domain.split('?')[0];
  domain = domain.split('#')[0];

  // Remover puerto
  domain = domain.split(':')[0];

  return domain;
}

/**
 * Validar y sanitizar dominio
 */
export function validateAndSanitizeDomain(input: string): {
  valid: boolean;
  domain?: string;
  error?: string;
} {
  try {
    const sanitized = sanitizeDomain(input);
    const validated = DomainSchema.parse(sanitized);
    return { valid: true, domain: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors[0]?.message || 'Invalid domain',
      };
    }
    return { valid: false, error: 'Invalid domain format' };
  }
}

/**
 * Validar dirección IP (IPv4)
 */
export function isValidIPv4(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

/**
 * Validar dirección IP (IPv6)
 */
export function isValidIPv6(ip: string): boolean {
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
  return ipv6Regex.test(ip);
}

/**
 * Validar cualquier IP (v4 o v6)
 */
export function isValidIP(ip: string): boolean {
  return isValidIPv4(ip) || isValidIPv6(ip);
}

/**
 * Verificar si una IP es pública (no privada/reservada)
 */
export function isPublicIP(ip: string): boolean {
  if (!isValidIPv4(ip)) return false;

  const parts = ip.split('.').map(Number);

  // Rangos privados
  if (parts[0] === 10) return false; // 10.0.0.0/8
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false; // 172.16.0.0/12
  if (parts[0] === 192 && parts[1] === 168) return false; // 192.168.0.0/16

  // Loopback
  if (parts[0] === 127) return false; // 127.0.0.0/8

  // Link-local
  if (parts[0] === 169 && parts[1] === 254) return false; // 169.254.0.0/16

  // Multicast
  if (parts[0] >= 224 && parts[0] <= 239) return false; // 224.0.0.0/4

  // Reserved
  if (parts[0] >= 240) return false; // 240.0.0.0/4

  return true;
}

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizar string para prevenir XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .trim();
}

/**
 * Truncar string a longitud máxima
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
