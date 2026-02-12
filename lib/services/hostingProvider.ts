import dns from 'dns/promises';
import axios from 'axios';
import whoiser from 'whoiser';
import { HostingProviderInfo } from '../types';
import { tryCatch, ExternalAPIError } from '../utils/errorHandler';
import cache, { generateCacheKey, CacheTTL } from '../utils/cache';

// Base de datos de proveedores conocidos
const KNOWN_PROVIDERS: Record<string, RegExp[]> = {
  'Amazon Web Services (AWS)': [
    /amazon/i,
    /aws/i,
    /ec2/i,
    /cloudfront/i,
    /amazonaws/i,
  ],
  'Google Cloud Platform (GCP)': [
    /google/i,
    /gcp/i,
    /cloud\.google/i,
    /googleusercontent/i,
  ],
  'Microsoft Azure': [
    /microsoft/i,
    /azure/i,
    /msft/i,
  ],
  'Cloudflare': [
    /cloudflare/i,
    /cf-ray/i,
  ],
  'Hetzner': [
    /hetzner/i,
    /hetzner online/i,
  ],
  'DigitalOcean': [
    /digitalocean/i,
    /digital ocean/i,
  ],
  'OVH': [
    /ovh/i,
    /ovh hosting/i,
  ],
  'Linode (Akamai)': [
    /linode/i,
    /akamai/i,
  ],
  'Vultr': [
    /vultr/i,
    /choopa/i,
  ],
  'Alibaba Cloud': [
    /alibaba/i,
    /aliyun/i,
  ],
  'Oracle Cloud': [
    /oracle/i,
    /oraclecloud/i,
  ],
  'GoDaddy': [
    /godaddy/i,
    /secureserver/i,
  ],
  'Namecheap': [
    /namecheap/i,
  ],
  'Hostinger': [
    /hostinger/i,
  ],
  'Bluehost': [
    /bluehost/i,
  ],
  'SiteGround': [
    /siteground/i,
  ],
  'DreamHost': [
    /dreamhost/i,
  ],
  'A2 Hosting': [
    /a2hosting/i,
  ],
  'InMotion Hosting': [
    /inmotionhosting/i,
  ],
  'HostGator': [
    /hostgator/i,
  ],
};

/**
 * Identificar proveedor de hosting para un dominio
 */
export async function getHostingProvider(domain: string): Promise<{
  success: boolean;
  data?: HostingProviderInfo;
  error?: string;
  cached?: boolean;
}> {
  const cacheKey = generateCacheKey('hosting', domain);

  // Verificar caché
  const cached = cache.get<HostingProviderInfo>(cacheKey);
  if (cached) {
    return { success: true, data: cached, cached: true };
  }

  const result = await tryCatch(async () => {
    // 1. Resolver dominio a IP
    const addresses = await dns.resolve4(domain);
    const ip = addresses[0];

    // 2. Obtener información de ASN/Organización
    const providerInfo = await identifyProvider(ip, domain);

    return {
      domain,
      ip,
      ...providerInfo,
    };
  }, `Error identifying hosting provider for ${domain}`);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Guardar en caché (usar TTL de WHOIS)
  cache.set(cacheKey, result.data, CacheTTL.WHOIS);

  return { success: true, data: result.data, cached: false };
}

/**
 * Identificar proveedor usando múltiples fuentes
 */
async function identifyProvider(
  ip: string,
  domain: string
): Promise<{
  provider: string;
  organization: string;
  asn?: string;
  asnNumber?: number;
  network?: string;
  country?: string;
  confidence: 'high' | 'medium' | 'low';
}> {
  // Estrategia 1: IPInfo.io (mejor para ASN)
  const ipInfoResult = await getProviderFromIPInfo(ip);
  if (ipInfoResult) {
    return ipInfoResult;
  }

  // Estrategia 2: WHOIS de la IP
  const whoisResult = await getProviderFromWhois(ip);
  if (whoisResult) {
    return whoisResult;
  }

  // Estrategia 3: Reverse DNS
  const reverseDNSResult = await getProviderFromReverseDNS(ip);
  if (reverseDNSResult) {
    return reverseDNSResult;
  }

  // Fallback: desconocido
  return {
    provider: 'Unknown',
    organization: 'Unknown',
    confidence: 'low',
  };
}

/**
 * Obtener proveedor desde IPInfo.io
 */
async function getProviderFromIPInfo(ip: string): Promise<{
  provider: string;
  organization: string;
  asn?: string;
  asnNumber?: number;
  network?: string;
  country?: string;
  confidence: 'high' | 'medium' | 'low';
} | null> {
  const token = process.env.IPINFO_TOKEN;

  if (!token) {
    return null;
  }

  try {
    const response = await axios.get(`https://ipinfo.io/${ip}/json?token=${token}`, {
      timeout: 5000,
    });

    const data = response.data;

    if (!data.org) {
      return null;
    }

    // Parsear ASN (formato: "AS15169 Google LLC")
    let asnNumber: number | undefined;
    let asn: string | undefined;
    let organization = data.org;

    const asnMatch = data.org.match(/^AS(\d+)\s+(.+)$/);
    if (asnMatch) {
      asnNumber = parseInt(asnMatch[1]);
      asn = `AS${asnNumber}`;
      organization = asnMatch[2];
    }

    // Identificar proveedor conocido
    const provider = matchKnownProvider(organization);

    return {
      provider: provider || organization,
      organization,
      asn,
      asnNumber,
      network: data.hostname,
      country: data.country,
      confidence: provider ? 'high' : 'medium',
    };
  } catch (error) {
    console.error('Error fetching from IPInfo:', error);
    return null;
  }
}

/**
 * Obtener proveedor desde WHOIS de la IP
 */
async function getProviderFromWhois(ip: string): Promise<{
  provider: string;
  organization: string;
  asn?: string;
  asnNumber?: number;
  network?: string;
  country?: string;
  confidence: 'high' | 'medium' | 'low';
} | null> {
  try {
    const whoisData = await whoiser(ip, {
      timeout: 5000,
    });

    if (!whoisData) {
      return null;
    }

    // Extraer información relevante
    const firstKey = Object.keys(whoisData)[0];
    const data: any = whoisData[firstKey] || {};

    let organization =
      data.OrgName ||
      data.organisation ||
      data.org ||
      data.descr ||
      data.netname ||
      'Unknown';

    if (Array.isArray(organization)) {
      organization = organization[0];
    }

    let asn: string | undefined;
    let asnNumber: number | undefined;

    if (data.OriginAS || data.origin) {
      const asnValue = data.OriginAS || data.origin;
      const asnStr = Array.isArray(asnValue) ? asnValue[0] : asnValue;
      const match = asnStr.match(/AS(\d+)/i);
      if (match) {
        asnNumber = parseInt(match[1]);
        asn = `AS${asnNumber}`;
      }
    }

    const provider = matchKnownProvider(organization);

    return {
      provider: provider || organization,
      organization,
      asn,
      asnNumber,
      network: data.NetRange || data.inetnum,
      country: data.Country || data.country,
      confidence: provider ? 'high' : 'medium',
    };
  } catch (error) {
    console.error('Error fetching WHOIS for IP:', error);
    return null;
  }
}

/**
 * Obtener proveedor desde Reverse DNS
 */
async function getProviderFromReverseDNS(ip: string): Promise<{
  provider: string;
  organization: string;
  confidence: 'high' | 'medium' | 'low';
} | null> {
  try {
    const hostnames = await dns.reverse(ip);

    if (hostnames.length === 0) {
      return null;
    }

    const hostname = hostnames[0].toLowerCase();
    const provider = matchKnownProvider(hostname);

    if (provider) {
      return {
        provider,
        organization: hostname,
        confidence: 'medium',
      };
    }

    return {
      provider: hostname,
      organization: hostname,
      confidence: 'low',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Identificar proveedor conocido por nombre
 */
function matchKnownProvider(text: string): string | null {
  const lowerText = text.toLowerCase();

  for (const [provider, patterns] of Object.entries(KNOWN_PROVIDERS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerText)) {
        return provider;
      }
    }
  }

  return null;
}
