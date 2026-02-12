import { ReverseIPInfo } from '../types';

/**
 * Verificar si una IP es compartida (shared hosting)
 */
export function isSharedHosting(reverseIPInfo: ReverseIPInfo): boolean {
  return reverseIPInfo.totalDomains > 5;
}

/**
 * Obtener tipo de hosting basado en número de dominios
 */
export function getHostingType(reverseIPInfo: ReverseIPInfo): string {
  if (reverseIPInfo.totalDomains === 0 || reverseIPInfo.totalDomains === 1) {
    return 'Dedicated or VPS';
  } else if (reverseIPInfo.totalDomains <= 5) {
    return 'Small Shared Hosting';
  } else if (reverseIPInfo.totalDomains <= 50) {
    return 'Medium Shared Hosting';
  } else {
    return 'Large Shared Hosting';
  }
}
