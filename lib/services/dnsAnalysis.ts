import dns from 'dns/promises';
import { DNSAnalysisResult, NSRecord, SOARecord, MXRecord, ARecord, TXTRecord, ValidationResult, ValidationLevel } from '../types';
import { tryCatch } from '../utils/errorHandler';
import cache, { generateCacheKey, CacheTTL } from '../utils/cache';
import { isPublicIP } from '../utils/validators';

const DNS_TIMEOUT = 5000;

/**
 * Realizar análisis DNS completo de un dominio
 */
export async function getDNSAnalysis(domain: string): Promise<{
  success: boolean;
  data?: DNSAnalysisResult;
  error?: string;
  cached?: boolean;
}> {
  const cacheKey = generateCacheKey('dns-analysis', domain);

  // Verificar caché
  const cached = cache.get<DNSAnalysisResult>(cacheKey);
  if (cached) {
    return { success: true, data: cached, cached: true };
  }

  const result = await tryCatch(async () => {
    return await performDNSAnalysis(domain);
  }, `Error performing DNS analysis for ${domain}`);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Guardar en caché
  cache.set(cacheKey, result.data, CacheTTL.DNS_ANALYSIS);

  return { success: true, data: result.data, cached: false };
}

/**
 * Realizar análisis DNS completo
 */
async function performDNSAnalysis(domain: string): Promise<DNSAnalysisResult> {
  // Ejecutar todas las consultas en paralelo
  const [nsResult, soaResult, mxResult, aResult, txtResult] = await Promise.all([
    analyzeNS(domain),
    analyzeSOA(domain),
    analyzeMX(domain),
    analyzeA(domain),
    analyzeTXT(domain),
  ]);

  // Calcular resumen
  const summary = calculateSummary(nsResult, soaResult, mxResult, aResult, txtResult);

  return {
    domain,
    ns: nsResult,
    soa: soaResult,
    mx: mxResult,
    a: aResult,
    txt: txtResult,
    summary,
  };
}

/**
 * Analizar registros NS (Nameservers)
 */
async function analyzeNS(domain: string): Promise<{
  records: NSRecord[];
  validations: ValidationResult[];
}> {
  const validations: ValidationResult[] = [];
  const records: NSRecord[] = [];

  try {
    const nameservers = await dns.resolveNs(domain);

    if (nameservers.length === 0) {
      validations.push({
        level: 'ERROR',
        message: 'No nameservers found',
        details: 'Domain must have at least one nameserver',
      });
      return { records, validations };
    }

    // Validar número de nameservers
    if (nameservers.length < 2) {
      validations.push({
        level: 'WARNING',
        message: 'Only one nameserver found',
        details: 'It is recommended to have at least 2 nameservers for redundancy',
      });
    } else if (nameservers.length >= 2) {
      validations.push({
        level: 'PASS',
        message: `Found ${nameservers.length} nameservers`,
        details: 'Good redundancy configuration',
      });
    }

    // Analizar cada nameserver
    for (const ns of nameservers) {
      const nsRecord: NSRecord = {
        nameserver: ns.toLowerCase(),
        validations: [],
      };

      // Resolver IP del nameserver
      try {
        const ips = await dns.resolve4(ns);
        nsRecord.ip = ips;

        if (ips.length > 0) {
          nsRecord.validations.push({
            level: 'PASS',
            message: 'Nameserver resolves correctly',
            details: `Resolved to ${ips.join(', ')}`,
          });
        }
      } catch (error) {
        nsRecord.validations.push({
          level: 'ERROR',
          message: 'Nameserver does not resolve',
          details: `Failed to resolve ${ns} to IP address (Lame nameserver)`,
        });
      }

      records.push(nsRecord);
    }

    // Verificar distribución en diferentes subredes
    const uniqueSubnets = new Set(
      records
        .flatMap((r) => r.ip || [])
        .map((ip) => ip.split('.').slice(0, 2).join('.'))
    );

    if (uniqueSubnets.size === 1 && records.length > 1) {
      validations.push({
        level: 'WARNING',
        message: 'All nameservers are on the same subnet',
        details: 'For better redundancy, use nameservers on different networks',
      });
    } else if (uniqueSubnets.size > 1) {
      validations.push({
        level: 'PASS',
        message: 'Nameservers distributed across different subnets',
        details: 'Good redundancy configuration',
      });
    }
  } catch (error: any) {
    validations.push({
      level: 'ERROR',
      message: 'Failed to resolve nameservers',
      details: error.message,
    });
  }

  return { records, validations };
}

/**
 * Analizar registro SOA (Start of Authority)
 */
async function analyzeSOA(domain: string): Promise<{
  record: SOARecord | null;
  validations: ValidationResult[];
}> {
  const validations: ValidationResult[] = [];

  try {
    const soa = await dns.resolveSoa(domain);

    const soaRecord: SOARecord = {
      mname: soa.nsname,
      rname: soa.hostmaster,
      serial: soa.serial,
      refresh: soa.refresh,
      retry: soa.retry,
      expire: soa.expire,
      minttl: soa.minttl,
      validations: [],
    };

    // Validar serial (formato recomendado: YYYYMMDDNN)
    const serialStr = soa.serial.toString();
    if (serialStr.length === 10) {
      soaRecord.validations.push({
        level: 'PASS',
        message: 'Serial number format is correct',
        details: `Format: YYYYMMDDNN (${serialStr})`,
      });
    } else {
      soaRecord.validations.push({
        level: 'INFO',
        message: 'Serial number does not follow YYYYMMDDNN format',
        details: `Current: ${serialStr}`,
      });
    }

    // Validar refresh interval (recomendado: 1200-43200 = 20min-12h)
    if (soa.refresh < 1200) {
      soaRecord.validations.push({
        level: 'WARNING',
        message: 'Refresh interval is very short',
        details: `${soa.refresh}s (${Math.round(soa.refresh / 60)}min). Recommended: 1200-43200s (20min-12h)`,
      });
    } else if (soa.refresh > 43200) {
      soaRecord.validations.push({
        level: 'WARNING',
        message: 'Refresh interval is very long',
        details: `${soa.refresh}s (${Math.round(soa.refresh / 3600)}h). Recommended: 1200-43200s (20min-12h)`,
      });
    } else {
      soaRecord.validations.push({
        level: 'PASS',
        message: 'Refresh interval is within recommended range',
        details: `${soa.refresh}s (${Math.round(soa.refresh / 60)}min)`,
      });
    }

    // Validar retry interval (debe ser menor que refresh)
    if (soa.retry >= soa.refresh) {
      soaRecord.validations.push({
        level: 'WARNING',
        message: 'Retry interval should be less than refresh interval',
        details: `Retry: ${soa.retry}s, Refresh: ${soa.refresh}s`,
      });
    } else {
      soaRecord.validations.push({
        level: 'PASS',
        message: 'Retry interval is correct',
        details: `${soa.retry}s (less than refresh)`,
      });
    }

    // Validar expire (recomendado: 1209600-2419200 = 2-4 semanas)
    if (soa.expire < 1209600) {
      soaRecord.validations.push({
        level: 'WARNING',
        message: 'Expire time is too short',
        details: `${soa.expire}s (${Math.round(soa.expire / 86400)}d). Recommended: 2-4 weeks`,
      });
    } else {
      soaRecord.validations.push({
        level: 'PASS',
        message: 'Expire time is appropriate',
        details: `${soa.expire}s (${Math.round(soa.expire / 86400)}d)`,
      });
    }

    validations.push({
      level: 'PASS',
      message: 'SOA record found',
      details: `Master: ${soa.nsname}`,
    });

    return { record: soaRecord, validations };
  } catch (error: any) {
    validations.push({
      level: 'ERROR',
      message: 'Failed to resolve SOA record',
      details: error.message,
    });
    return { record: null, validations };
  }
}

/**
 * Analizar registros MX (Mail Exchange)
 */
async function analyzeMX(domain: string): Promise<{
  records: MXRecord[];
  validations: ValidationResult[];
}> {
  const validations: ValidationResult[] = [];
  const records: MXRecord[] = [];

  try {
    const mxRecords = await dns.resolveMx(domain);

    if (mxRecords.length === 0) {
      validations.push({
        level: 'INFO',
        message: 'No MX records found',
        details: 'Domain is not configured for email',
      });
      return { records, validations };
    }

    // Validar redundancia
    if (mxRecords.length === 1) {
      validations.push({
        level: 'WARNING',
        message: 'Only one MX record found',
        details: 'Consider adding backup MX servers for redundancy',
      });
    } else {
      validations.push({
        level: 'PASS',
        message: `Found ${mxRecords.length} MX records`,
        details: 'Good redundancy for mail servers',
      });
    }

    // Analizar cada MX
    for (const mx of mxRecords) {
      const mxRecord: MXRecord = {
        exchange: mx.exchange.toLowerCase(),
        priority: mx.priority,
        validations: [],
      };

      // Resolver IP del MX
      try {
        const ips = await dns.resolve4(mx.exchange);
        mxRecord.ip = ips;

        // Verificar PTR (reverse DNS) para cada IP
        for (const ip of ips) {
          try {
            const ptrs = await dns.reverse(ip);
            mxRecord.hasPTR = ptrs.length > 0;
            mxRecord.ptrRecord = ptrs;

            if (ptrs.length > 0) {
              mxRecord.validations.push({
                level: 'PASS',
                message: 'PTR record exists',
                details: `${ip} → ${ptrs.join(', ')}`,
              });
            }
          } catch {
            mxRecord.hasPTR = false;
            mxRecord.validations.push({
              level: 'WARNING',
              message: 'No PTR record found',
              details: `${ip} has no reverse DNS. This may cause email delivery issues.`,
            });
          }
        }

        // Verificar IP pública
        if (!isPublicIP(ips[0])) {
          mxRecord.validations.push({
            level: 'ERROR',
            message: 'MX points to private IP',
            details: `${ips[0]} is not a public IP address`,
          });
        }
      } catch (error: any) {
        mxRecord.validations.push({
          level: 'ERROR',
          message: 'Failed to resolve MX server',
          details: `Cannot resolve ${mx.exchange} to IP`,
        });
      }

      records.push(mxRecord);
    }
  } catch (error: any) {
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
      validations.push({
        level: 'INFO',
        message: 'No MX records found',
        details: 'Domain is not configured for email',
      });
    } else {
      validations.push({
        level: 'ERROR',
        message: 'Failed to resolve MX records',
        details: error.message,
      });
    }
  }

  return { records, validations };
}

/**
 * Analizar registros A y AAAA
 */
async function analyzeA(domain: string): Promise<{
  records: ARecord[];
  validations: ValidationResult[];
}> {
  const validations: ValidationResult[] = [];
  const records: ARecord[] = [];

  // Analizar A (IPv4)
  try {
    const ipv4s = await dns.resolve4(domain, { ttl: true });

    for (const record of ipv4s) {
      const aRecord: ARecord = {
        hostname: domain,
        ip: record.address,
        type: 'A',
        ttl: record.ttl,
        validations: [],
      };

      // Verificar PTR
      try {
        const ptrs = await dns.reverse(record.address);
        aRecord.hasPTR = ptrs.length > 0;
        aRecord.ptrRecord = ptrs;

        if (ptrs.length > 0) {
          aRecord.validations.push({
            level: 'INFO',
            message: 'PTR record exists',
            details: `${record.address} → ${ptrs.join(', ')}`,
          });
        } else {
          aRecord.validations.push({
            level: 'INFO',
            message: 'No PTR record',
            details: `${record.address} has no reverse DNS (optional for web servers)`,
          });
        }
      } catch {
        aRecord.hasPTR = false;
        aRecord.validations.push({
          level: 'INFO',
          message: 'No PTR record',
          details: `${record.address} has no reverse DNS (optional for web servers)`,
        });
      }

      // Verificar IP pública
      if (!isPublicIP(record.address)) {
        aRecord.validations.push({
          level: 'ERROR',
          message: 'Private IP address',
          details: `${record.address} is not a public IP`,
        });
      } else {
        aRecord.validations.push({
          level: 'PASS',
          message: 'Public IP address',
          details: record.address,
        });
      }

      records.push(aRecord);
    }

    validations.push({
      level: 'PASS',
      message: `Found ${ipv4s.length} A record(s)`,
      details: ipv4s.map((r) => r.address).join(', '),
    });
  } catch (error: any) {
    validations.push({
      level: 'ERROR',
      message: 'Failed to resolve A records',
      details: error.message,
    });
  }

  // Analizar AAAA (IPv6)
  try {
    const ipv6s = await dns.resolve6(domain, { ttl: true });

    for (const record of ipv6s) {
      const aRecord: ARecord = {
        hostname: domain,
        ip: record.address,
        type: 'AAAA',
        ttl: record.ttl,
        validations: [],
      };

      aRecord.validations.push({
        level: 'PASS',
        message: 'IPv6 support enabled',
        details: record.address,
      });

      records.push(aRecord);
    }

    validations.push({
      level: 'INFO',
      message: `Found ${ipv6s.length} AAAA record(s)`,
      details: 'IPv6 support is enabled',
    });
  } catch {
    validations.push({
      level: 'INFO',
      message: 'No AAAA records (IPv6) found',
      details: 'IPv6 is not configured (optional)',
    });
  }

  // Verificar www
  try {
    await dns.resolve4(`www.${domain}`);
    validations.push({
      level: 'PASS',
      message: 'www subdomain resolves correctly',
    });
  } catch {
    validations.push({
      level: 'WARNING',
      message: 'www subdomain does not resolve',
      details: 'Consider adding a www CNAME or A record',
    });
  }

  return { records, validations };
}

/**
 * Analizar registros TXT (SPF, DMARC, DKIM)
 */
async function analyzeTXT(domain: string): Promise<{
  records: TXTRecord[];
  validations: ValidationResult[];
}> {
  const validations: ValidationResult[] = [];
  const records: TXTRecord[] = [];

  try {
    const txtRecords = await dns.resolveTxt(domain);

    let hasSPF = false;
    let hasDMARC = false;

    for (const record of txtRecords) {
      const value = Array.isArray(record) ? record.join('') : record;

      if (value.startsWith('v=spf1')) {
        hasSPF = true;
        records.push({
          type: 'SPF',
          value,
          validations: [
            {
              level: 'PASS',
              message: 'SPF record found',
              details: 'Email authentication is configured',
            },
          ],
        });
      } else if (value.startsWith('v=DMARC1')) {
        hasDMARC = true;
        records.push({
          type: 'DMARC',
          value,
          validations: [
            {
              level: 'PASS',
              message: 'DMARC record found',
              details: 'Email policy is configured',
            },
          ],
        });
      } else if (value.includes('DKIM') || value.includes('k=rsa')) {
        records.push({
          type: 'DKIM',
          value,
          validations: [
            {
              level: 'PASS',
              message: 'DKIM record found',
            },
          ],
        });
      } else {
        records.push({
          type: 'OTHER',
          value,
          validations: [],
        });
      }
    }

    // Validaciones globales
    if (!hasSPF) {
      validations.push({
        level: 'WARNING',
        message: 'No SPF record found',
        details: 'SPF helps prevent email spoofing',
      });
    } else {
      validations.push({
        level: 'PASS',
        message: 'SPF record configured',
      });
    }

    if (!hasDMARC) {
      validations.push({
        level: 'INFO',
        message: 'No DMARC record found',
        details: 'DMARC provides additional email security',
      });
    } else {
      validations.push({
        level: 'PASS',
        message: 'DMARC record configured',
      });
    }
  } catch (error: any) {
    validations.push({
      level: 'INFO',
      message: 'No TXT records found',
      details: 'Email authentication records are not configured',
    });
  }

  return { records, validations };
}

/**
 * Calcular resumen del análisis
 */
function calculateSummary(...sections: any[]): DNSAnalysisResult['summary'] {
  let totalChecks = 0;
  let passed = 0;
  let warnings = 0;
  let errors = 0;
  let info = 0;

  for (const section of sections) {
    // Validaciones de la sección
    if (section.validations) {
      for (const val of section.validations) {
        totalChecks++;
        if (val.level === 'PASS') passed++;
        else if (val.level === 'WARNING') warnings++;
        else if (val.level === 'ERROR') errors++;
        else if (val.level === 'INFO') info++;
      }
    }

    // Validaciones de los registros
    if (section.records) {
      for (const record of section.records) {
        if (record.validations) {
          for (const val of record.validations) {
            totalChecks++;
            if (val.level === 'PASS') passed++;
            else if (val.level === 'WARNING') warnings++;
            else if (val.level === 'ERROR') errors++;
            else if (val.level === 'INFO') info++;
          }
        }
      }
    }

    // SOA record validations
    if (section.record && section.record.validations) {
      for (const val of section.record.validations) {
        totalChecks++;
        if (val.level === 'PASS') passed++;
        else if (val.level === 'WARNING') warnings++;
        else if (val.level === 'ERROR') errors++;
        else if (val.level === 'INFO') info++;
      }
    }
  }

  // Calcular score (0-100)
  const score = totalChecks > 0
    ? Math.round((passed * 100 + warnings * 50 - errors * 100) / totalChecks)
    : 0;

  return {
    totalChecks,
    passed,
    warnings,
    errors,
    info,
    score: Math.max(0, Math.min(100, score)),
  };
}
