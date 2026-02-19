import tls from 'tls';
import { SSLCheckInfo, CertificateChainItem } from '../types';
import cache, { generateCacheKey, CacheTTL } from '../utils/cache';

/**
 * Perform a detailed SSL check for a domain
 */
export async function getSSLDetails(domain: string): Promise<{
    success: boolean;
    data?: SSLCheckInfo;
    error?: string;
    cached?: boolean;
}> {
    const cacheKey = generateCacheKey('ssl', domain);

    // Check cache
    const cached = cache.get<SSLCheckInfo>(cacheKey);
    if (cached) {
        return { success: true, data: cached, cached: true };
    }

    // Parallelize SSL check, IP resolution, and Headers check
    const [sslResult, dnsResult, headersResult] = await Promise.allSettled([
        performSSLCheck(domain),
        resolveIP(domain),
        fetchHeaders(domain)
    ]);

    if (sslResult.status === 'rejected' || !sslResult.value.success) {
        return {
            success: false,
            error: sslResult.status === 'rejected' ? 'SSL check failed' : sslResult.value.error
        };
    }

    const data = sslResult.value.data!;

    // Merge IP data
    if (dnsResult.status === 'fulfilled' && dnsResult.value) {
        data.ip = dnsResult.value;
    }

    // Merge Headers data
    if (headersResult.status === 'fulfilled' && headersResult.value) {
        data.server = headersResult.value.server;
        data.hsts = headersResult.value.hsts;
    }

    // Cache result (5 minutes)
    cache.set(cacheKey, data, CacheTTL.HEALTH);

    return { success: true, data: data, cached: false };
}

import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

async function resolveIP(domain: string): Promise<string | undefined> {
    try {
        const { address } = await lookup(domain);
        return address;
    } catch (e) {
        return undefined;
    }
}

async function fetchHeaders(domain: string): Promise<{ server?: string, hsts?: boolean } | undefined> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`https://${domain}`, {
            method: 'HEAD',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        return {
            server: response.headers.get('server') || undefined,
            hsts: response.headers.has('strict-transport-security')
        };
    } catch (e) {
        return undefined;
    }
}

async function performSSLCheck(domain: string): Promise<{
    success: boolean;
    data?: SSLCheckInfo;
    error?: string;
}> {
    return new Promise((resolve) => {
        // Handle domains with ports (e.g. example.com:8443)
        let host = domain;
        let port = 443;

        if (domain.includes(':')) {
            const parts = domain.split(':');
            host = parts[0];
            port = parseInt(parts[1], 10) || 443;
        }

        const options = {
            host: host,
            port: port,
            servername: host, // SNI
            rejectUnauthorized: false, // We want to inspect bad certs too
            requestCert: true,
            agent: false,
            timeout: 10000,
        };

        let socket: tls.TLSSocket;

        try {
            socket = tls.connect(options, () => {
                try {
                    const cert = socket.getPeerCertificate(true);

                    if (!cert || Object.keys(cert).length === 0) {
                        socket.end();
                        resolve({
                            success: false,
                            error: 'No certificate found or empty certificate chain.',
                        });
                        return;
                    }

                    // Validate dates safely
                    if (!cert.valid_from || !cert.valid_to) {
                        socket.end();
                        resolve({ success: false, error: 'Certificate missing validity dates.' });
                        return;
                    }

                    const validFrom = new Date(cert.valid_from);
                    const validTo = new Date(cert.valid_to);

                    if (isNaN(validFrom.getTime()) || isNaN(validTo.getTime())) {
                        socket.end();
                        resolve({ success: false, error: 'Invalid certificate dates.' });
                        return;
                    }

                    const now = new Date();
                    const daysUntilExpiry = Math.ceil(
                        (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    const isAuthorized = socket.authorized;
                    const cipher = socket.getCipher();

                    // Safe access to issuer/subject (though they should exist on a valid cert)
                    const issuer = cert.issuer || {};
                    const subject = cert.subject || {};

                    const info: SSLCheckInfo = {
                        domain,
                        valid: isAuthorized && now >= validFrom && now <= validTo,
                        validFrom: validFrom.toISOString(),
                        validTo: validTo.toISOString(),
                        daysUntilExpiry,
                        issuer: {
                            C: issuer.C || '',
                            O: issuer.O || '',
                            CN: issuer.CN || '',
                            OU: issuer.OU || '',
                        },
                        subject: {
                            C: subject.C || '',
                            O: subject.O || '',
                            CN: subject.CN || '',
                            OU: subject.OU || '',
                            L: subject.L || '',
                            ST: subject.ST || '',
                        },
                        protocol: socket.getProtocol() || undefined,
                        cipher: cipher,
                        serialNumber: cert.serialNumber,
                        fingerprint: cert.fingerprint,
                        fingerprint256: cert.fingerprint256,
                        signatureAlgorithm: (cert as any).sigalg,
                        sans: cert.subjectaltname ? cert.subjectaltname.split(', ') : [],
                        chain: getCertificateChain(cert),
                    };

                    socket.end();
                    resolve({ success: true, data: info });
                } catch (err: any) {
                    socket.end();
                    resolve({ success: false, error: `Parsing error: ${err.message}` });
                }
            });

            socket.on('error', (err) => {
                resolve({ success: false, error: err.message });
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve({ success: false, error: 'Connection timed out' });
            });

        } catch (err: any) {
            resolve({ success: false, error: err.message });
        }
    });
}

function getCertificateChain(cert: tls.PeerCertificate): CertificateChainItem[] {
    const chain: CertificateChainItem[] = [];
    let currentCert = cert;

    while (true) {
        // Add current cert to chain
        chain.push({
            subject: {
                C: currentCert.subject.C,
                O: currentCert.subject.O,
                CN: currentCert.subject.CN,
                OU: currentCert.subject.OU,
            },
            issuer: {
                C: currentCert.issuer.C,
                O: currentCert.issuer.O,
                CN: currentCert.issuer.CN,
                OU: currentCert.issuer.OU,
            },
            validFrom: currentCert.valid_from,
            validTo: currentCert.valid_to,
            fingerprint: currentCert.fingerprint,
            serialNumber: currentCert.serialNumber,
            signatureAlgorithm: (currentCert as any).sigalg
        });

        // Check if self-signed (Root CA) or no issuer cert available
        // Note: In Node.js tls, issuerCertificate is a property that points to the issuer.
        // If it's a self-signed cert or root, it might point to itself or be null.
        if ((currentCert as any).issuerCertificate &&
            (currentCert as any).issuerCertificate !== currentCert && // Avoid infinite loop if circular reference exists
            currentCert.fingerprint !== (currentCert as any).issuerCertificate.fingerprint) {
            currentCert = (currentCert as any).issuerCertificate;
        } else {
            break;
        }
    }

    return chain;
}
