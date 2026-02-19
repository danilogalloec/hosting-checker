
import { useState } from 'react';
import { Search, Lock, Shield, AlertTriangle, CheckCircle, Server, Globe, Activity } from 'lucide-react';
import { SSLCheckInfo } from '@/lib/types';

// Sub-component for Security Recommendations
function SecurityRecommendations({ result }: { result: SSLCheckInfo }) {
    const recommendations = [];

    // Protocol Check
    if (result.protocol === 'TLSv1' || result.protocol === 'TLSv1.1') {
        recommendations.push({
            title: 'Disable Obsolete Protocols (TLS 1.0/1.1)',
            severity: 'critical',
            description: `Your server is using ${result.protocol}, which is deprecated and insecure. Upgrade to TLS 1.2 or 1.3.`,
            remediation: {
                apache: `SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1`,
                nginx: `ssl_protocols TLSv1.2 TLSv1.3;`
            }
        });
    }

    // Expiry Check
    if (result.daysUntilExpiry < 15) {
        recommendations.push({
            title: 'Renew SSL Certificate Soon',
            severity: result.daysUntilExpiry < 7 ? 'critical' : 'warning',
            description: `Certificate expires in ${result.daysUntilExpiry} days. Renew it to avoid downtime.`,
            remediation: null
        });
    }

    // Signature Algorithm Check
    if (result.signatureAlgorithm && (result.signatureAlgorithm.includes('sha1') || result.signatureAlgorithm.includes('md5'))) {
        recommendations.push({
            title: 'Weak Signature Algorithm Detected',
            severity: 'critical',
            description: `The certificate uses ${result.signatureAlgorithm}, which is considered weak. Re-issue your certificate with SHA-256 or better.`,
            remediation: null
        });
    }

    // Server Security Check
    if (result.server && result.server.toLowerCase().includes('apache')) {
        recommendations.push({
            title: 'Hide Server Signature',
            severity: 'warning',
            description: 'Apache server version information is visible. Hide it to prevent reconnaissance.',
            remediation: {
                apache: `ServerTokens Prod\nServerSignature Off`,
                nginx: `` // Not robustly detectable via simple header for Nginx usually, but good practice
            }
        });
    }

    if (recommendations.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                    <Shield className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Security Recommendations</h3>
            </div>

            <div className="space-y-6">
                {recommendations.map((rec, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${rec.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <h4 className={`font-bold mb-2 ${rec.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'}`}>
                            {rec.title}
                        </h4>
                        <p className={`text-sm mb-4 ${rec.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'}`}>
                            {rec.description}
                        </p>

                        {rec.remediation && (
                            <div className="space-y-3">
                                <div className="bg-gray-900 rounded-md overflow-hidden">
                                    <div className="bg-gray-800 px-3 py-1 text-xs text-gray-300 font-mono">Apache (httpd.conf / ssl.conf)</div>
                                    <code className="block p-3 text-sm text-green-400 font-mono whitespace-pre-wrap">
                                        {rec.remediation.apache}
                                    </code>
                                </div>
                                <div className="bg-gray-900 rounded-md overflow-hidden">
                                    <div className="bg-gray-800 px-3 py-1 text-xs text-gray-300 font-mono">Nginx (nginx.conf)</div>
                                    <code className="block p-3 text-sm text-green-400 font-mono whitespace-pre-wrap">
                                        {rec.remediation.nginx}
                                    </code>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function CertificateChainDisplay({ chain }: { chain: SSLCheckInfo['chain'] }) {
    if (!chain || chain.length === 0) return null;

    // Common Root CAs to trust even if the self-signed cert is not sent by server
    // This solves "Incomplete Chain" for valid chains where Root is omitted (standard practice)
    const TRUSTED_ROOTS = [
        'AAA Certificate Services',
        'Sectigo',
        'DigiCert',
        'GlobalSign',
        'Let\'s Encrypt',
        'Google Trust Services',
        'GTS Root',
        'ISRG Root',
        'Baltimore CyberTrust Root',
        'Cloudflare'
    ];

    const lastCert = chain[chain.length - 1];
    const isRoot = lastCert.subject.CN === lastCert.issuer.CN;

    // Check if the last issuer is in our trusted list or contains trusted keywords
    const isKnownRoot = TRUSTED_ROOTS.some(root =>
        (lastCert.issuer.CN && lastCert.issuer.CN.includes(root)) ||
        (lastCert.issuer.O && lastCert.issuer.O.includes(root))
    );

    const isIncomplete = !isRoot && !isKnownRoot;

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Certificate Chain</h3>
                {!isIncomplete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                        <AlertTriangle className="h-3 w-3" />
                        Partial Chain
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-2 relative">
                {chain.map((cert, idx) => (
                    <div key={idx} className="relative z-10">
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className={`p-1.5 rounded-full ${idx === 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                <Lock className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                        {cert.subject.CN || 'Unknown'}
                                    </h4>
                                    <span className="text-xs text-gray-400 font-mono hidden sm:block">
                                        {cert.serialNumber.slice(0, 8)}...
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    <span className="truncate">By: {cert.issuer.CN || 'Unknown'}</span>
                                    {cert.signatureAlgorithm && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className="truncate">{cert.signatureAlgorithm}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Connector Arrow */}
                        {idx < chain.length - 1 && (
                            <div className="flex justify-center -my-1 relative z-0">
                                <div className="h-4 w-0.5 bg-gray-300"></div>
                            </div>
                        )}
                    </div>
                ))}

                {isIncomplete && (
                    <div className="mt-2 p-3 bg-gray-50 text-gray-600 text-xs rounded-lg border border-gray-200 flex items-start gap-2">
                        <Activity className="h-4 w-4 mt-0.5 text-gray-400" />
                        <span>
                            Note: The root certificate was not sent by the server. This is common configuration as browsers rely on their built-in trust store.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SSLAnalysisTool() {
    // ... existing component code ...
    const [domain, setDomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SSLCheckInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domain) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`/api/ssl-check?domain=${encodeURIComponent(domain)}`);
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Error analyzing SSL');
            }

            setResult(data.data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDaysRemainingColor = (days: number, protocol?: string) => {
        // Obsolete protocol check
        if (protocol && (protocol === 'TLSv1' || protocol === 'TLSv1.1')) {
            return 'text-red-600 bg-red-100';
        }

        if (days < 0) return 'text-red-600 bg-red-100';
        if (days < 7) return 'text-red-600 bg-red-100'; // Critical (< 7 days)
        if (days < 15) return 'text-yellow-600 bg-yellow-100'; // Warning (< 15 days)
        return 'text-green-600 bg-green-100';
    };

    const isCritical = (result: SSLCheckInfo) => {
        if (!result.valid) return true;
        if (result.daysUntilExpiry < 7) return true;
        if (result.protocol === 'TLSv1' || result.protocol === 'TLSv1.1') return true;
        return false;
    };

    const isWarning = (result: SSLCheckInfo) => {
        if (isCritical(result)) return false; // Critical takes precedence
        if (result.daysUntilExpiry < 15) return true;
        return false;
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-green-600 p-6 text-white">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Lock className="h-6 w-6" />
                        SSL Checker
                    </h2>
                    <p className="opacity-90 mt-1">
                        Analyze SSL/TLS certificates for any domain to verify security and validity
                    </p>
                </div>

                <div className="p-6">
                    {/* Search Form */}
                    <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="Enter domain name (e.g., google.com)"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            ) : (
                                <Search className="h-5 w-5" />
                            )}
                            Check SSL
                        </button>
                    </form>

                    {error && (
                        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Results Section */}
                    {result && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Status Banner */}
                            <div className={`p-6 rounded-xl border ${isCritical(result)
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : isWarning(result)
                                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                    : 'bg-green-50 border-green-200 text-green-800'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${isCritical(result)
                                        ? 'bg-red-200'
                                        : isWarning(result)
                                            ? 'bg-yellow-200'
                                            : 'bg-green-200'
                                        }`}>
                                        {isCritical(result)
                                            ? <AlertTriangle className="h-8 w-8 text-red-700" />
                                            : isWarning(result)
                                                ? <AlertTriangle className="h-8 w-8 text-yellow-700" />
                                                : <CheckCircle className="h-8 w-8 text-green-700" />
                                        }
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">
                                            {isCritical(result)
                                                ? (result.valid ? `Attention: Security issues detected for ${result.domain}` : `The certificate for ${result.domain} is INVALID or EXPIRED.`)
                                                : isWarning(result)
                                                    ? `Warning: Certificate for ${result.domain} expires soon.`
                                                    : `The certificate for ${result.domain} is valid and secure.`
                                            }
                                        </h3>
                                        <div className="mt-2 flex gap-3 flex-wrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDaysRemainingColor(result.daysUntilExpiry, result.protocol)}`}>
                                                {result.daysUntilExpiry > 0
                                                    ? `${result.daysUntilExpiry} days remaining`
                                                    : `Expired ${Math.abs(result.daysUntilExpiry)} days ago`
                                                }
                                            </span>
                                            {(result.protocol === 'TLSv1' || result.protocol === 'TLSv1.1') && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-red-600 bg-red-100">
                                                    Obsolete Protocol: {result.protocol}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Certificate Info */}
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Shield className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Certificate Information</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="border-b pb-2">
                                            <span className="text-gray-500 text-sm block">Common Name (CN)</span>
                                            <span className="font-medium break-all">{result.subject.CN || 'N/A'}</span>
                                        </div>
                                        <div className="border-b pb-2">
                                            <span className="text-gray-500 text-sm block">Organization (O)</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{result.subject.O || 'N/A'}</span>
                                                {result.subject.O && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700" title="Organization Validated Identity">
                                                        <Shield className="h-3 w-3" />
                                                        Identity Validated
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="border-b pb-2">
                                            <span className="text-gray-500 text-sm block">Location</span>
                                            <span className="font-medium">
                                                {[result.subject.L, result.subject.ST, result.subject.C].filter(Boolean).join(', ') || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="border-b pb-2">
                                            <span className="text-gray-500 text-sm block">Serial Number</span>
                                            <span className="font-mono text-xs break-all">{result.serialNumber}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm block">Fingerprint (SHA1)</span>
                                            <span className="font-mono text-xs break-all">{result.fingerprint}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Issuer Info */}
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Server className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Issuer Information</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="border-b pb-2">
                                            <span className="text-gray-500 text-sm block">Issued By</span>
                                            <span className="font-medium break-all">{result.issuer.CN || result.issuer.O || 'N/A'}</span>
                                        </div>
                                        <div className="border-b pb-2">
                                            <span className="text-gray-500 text-sm block">Organization</span>
                                            <span className="font-medium">{result.issuer.O || 'N/A'}</span>
                                        </div>
                                        <div className="border-b pb-2">
                                            <span className="text-gray-500 text-sm block">Country</span>
                                            <span className="font-medium">{result.issuer.C || 'N/A'}</span>
                                        </div>
                                        <div className="pt-2">
                                            <h4 className="font-semibold text-sm mb-2 text-gray-700">Validity Period</h4>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-500">Issued On</span>
                                                <span className="font-medium">{formatDate(result.validFrom)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Expires On</span>
                                                <span className="font-medium">{formatDate(result.validTo)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Technical Details */}
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <Lock className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Security Details</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="border-b md:border-b-0 md:border-r border-gray-100 pb-2 md:pb-0 md:pr-4">
                                            <span className="text-gray-500 text-sm block">Protocol Version</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium ${(result.protocol === 'TLSv1' || result.protocol === 'TLSv1.1') ? 'text-red-600' : 'text-green-600'}`}>
                                                    {result.protocol || 'Unknown'}
                                                </span>
                                                {result.protocol === 'TLSv1.3' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Robust
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pb-2 md:pb-0">
                                            <span className="text-gray-500 text-sm block">Cipher Suite</span>
                                            <span className="font-medium text-sm break-all">
                                                {typeof result.cipher === 'string' ? result.cipher : (result.cipher?.name || 'Unknown')}
                                            </span>
                                        </div>
                                        {result.signatureAlgorithm && (
                                            <div className="col-span-1 md:col-span-2 border-t border-gray-100 pt-2 mt-2">
                                                <span className="text-gray-500 text-sm block">Signature Algorithm</span>
                                                <span className="font-medium text-sm font-mono">{result.signatureAlgorithm}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Network & Server Info */}
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-100 rounded-lg">
                                            <Activity className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Network & Server</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="border-b pb-2">
                                            <span className="text-gray-500 text-sm block">Resolved IP</span>
                                            <span className="font-medium font-mono">{result.ip || 'N/A'}</span>
                                        </div>
                                        <div className="border-b pb-2">
                                            <span className="text-gray-500 text-sm block">Server Software</span>
                                            <span className="font-medium">{result.server || 'Hidden/Unknown'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm block">HSTS Status</span>
                                            <span className={`font-medium ${result.hsts ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {result.hsts ? 'Enabled (Strict-Transport-Security)' : 'Not Enabled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SANs */}
                            {result.sans && result.sans.length > 0 && (
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <Globe className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Subject Alternative Names (SANs)</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {result.sans.map((san, index) => (
                                            <span key={index} className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-mono border border-gray-200">
                                                {san}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Security Recommendations */}
                            <CertificateChainDisplay chain={result.chain} />
                            <SecurityRecommendations result={result} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
