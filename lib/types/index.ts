// ============================================
// TIPOS GENERALES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp: string;
}

export type ValidationLevel = 'PASS' | 'WARNING' | 'ERROR' | 'INFO';

export interface ValidationResult {
  level: ValidationLevel;
  message: string;
  details?: string;
}

// ============================================
// HOSTING PROVIDER
// ============================================

export interface HostingProviderInfo {
  domain: string;
  ip: string;
  provider: string;
  organization: string;
  asn?: string;
  asnNumber?: number;
  network?: string;
  country?: string;
  confidence: 'high' | 'medium' | 'low';
}

// ============================================
// WHOIS
// ============================================

export interface WhoisInfo {
  domain: string;
  registrar?: string;
  registrarUrl?: string;
  createdDate?: string;
  updatedDate?: string;
  expiryDate?: string;
  status?: string[];
  nameservers?: string[];
  dnssec?: string;
  registrantOrganization?: string;
  registrantCountry?: string;
  adminEmail?: string;
  techEmail?: string;
  raw?: string;
}

// ============================================
// REVERSE IP
// ============================================

export interface ReverseIPInfo {
  ip: string;
  totalDomains: number;
  domains: string[];
  limited: boolean;
  source: string;
}

// ============================================
// GEOLOCATION
// ============================================

export interface GeolocationInfo {
  ip: string;
  city?: string;
  region?: string;
  country: string;
  countryName?: string;
  countryCode?: string;
  continent?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  asName?: string;
  postal?: string;
}

// ============================================
// HEALTH CHECK
// ============================================

export interface HealthCheckInfo {
  domain: string;
  url: string;
  status: 'online' | 'offline' | 'error';
  httpStatus?: number;
  responseTime?: number;
  ssl: {
    enabled: boolean;
    valid?: boolean;
    issuer?: string;
    validFrom?: string;
    validTo?: string;
    daysUntilExpiry?: number;
  };
  redirects?: number;
  finalUrl?: string;
  serverHeader?: string;
  pingTime?: number;
  error?: string;
}

// ============================================
// DNS ANALYSIS
// ============================================

export interface DNSRecord {
  type: string;
  value: string;
  ttl?: number;
  priority?: number;
  additional?: Record<string, any>;
}

export interface NSRecord {
  nameserver: string;
  ip?: string[];
  responseTime?: number;
  hasGlueRecord?: boolean;
  validations: ValidationResult[];
}

export interface SOARecord {
  mname: string;
  rname: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minttl: number;
  validations: ValidationResult[];
}

export interface MXRecord {
  exchange: string;
  priority: number;
  ip?: string[];
  hasPTR?: boolean;
  ptrRecord?: string[];
  validations: ValidationResult[];
}

export interface ARecord {
  hostname: string;
  ip: string;
  type: 'A' | 'AAAA';
  hasPTR?: boolean;
  ptrRecord?: string[];
  ttl?: number;
  validations: ValidationResult[];
}

export interface TXTRecord {
  type: 'SPF' | 'DMARC' | 'DKIM' | 'OTHER';
  value: string;
  parsed?: Record<string, any>;
  validations: ValidationResult[];
}

export interface DNSAnalysisResult {
  domain: string;
  ns: {
    records: NSRecord[];
    validations: ValidationResult[];
  };
  soa: {
    record: SOARecord | null;
    validations: ValidationResult[];
  };
  mx: {
    records: MXRecord[];
    validations: ValidationResult[];
  };
  a: {
    records: ARecord[];
    validations: ValidationResult[];
  };
  txt: {
    records: TXTRecord[];
    validations: ValidationResult[];
  };
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    errors: number;
    info: number;
    score: number; // 0-100
  };
}

// ============================================
// CACHE
// ============================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

// ============================================
// RATE LIMIT
// ============================================

export interface RateLimitInfo {
  ip: string;
  requests: number;
  windowStart: number;
  blocked: boolean;
}
