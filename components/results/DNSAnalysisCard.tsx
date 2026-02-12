import { Network, Server, Mail, Globe, FileText, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DNSAnalysisResult, ValidationResult, ValidationLevel } from '@/lib/types';

interface DNSAnalysisCardProps {
  data?: DNSAnalysisResult;
  loading?: boolean;
  error?: string;
}

export function DNSAnalysisCard({ data, loading, error }: DNSAnalysisCardProps) {
  return (
    <Card
      title="DNS Analysis"
      subtitle="Complete DNS configuration check"
      icon={<Network className="h-6 w-6" />}
      loading={loading}
      error={error}
      className="col-span-full"
    >
      {data && (
        <div className="space-y-6">
          {/* Summary */}
          <DNSSummary summary={data.summary} />

          {/* NS Records */}
          <DNSSection
            title="Nameservers (NS)"
            icon={<Server className="h-5 w-5" />}
            validations={data.ns.validations}
          >
            {data.ns.records.length > 0 ? (
              <div className="space-y-3">
                {data.ns.records.map((ns, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-mono text-sm font-medium">{ns.nameserver}</span>
                      {ns.ip && ns.ip.length > 0 && (
                        <Badge variant="success">Resolves</Badge>
                      )}
                    </div>
                    {ns.ip && ns.ip.length > 0 && (
                      <p className="text-xs text-gray-600 font-mono">{ns.ip.join(', ')}</p>
                    )}
                    {ns.validations.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {ns.validations.map((val, vidx) => (
                          <ValidationItem key={vidx} validation={val} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No NS records found</p>
            )}
          </DNSSection>

          {/* SOA Record */}
          <DNSSection
            title="Start of Authority (SOA)"
            icon={<FileText className="h-5 w-5" />}
            validations={data.soa.validations}
          >
            {data.soa.record ? (
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Primary NS:</span>
                    <span className="ml-2 font-mono">{data.soa.record.mname}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Responsible:</span>
                    <span className="ml-2 font-mono text-xs">{data.soa.record.rname}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Serial:</span>
                    <span className="ml-2 font-mono">{data.soa.record.serial}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Refresh:</span>
                    <span className="ml-2">{data.soa.record.refresh}s</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Retry:</span>
                    <span className="ml-2">{data.soa.record.retry}s</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Expire:</span>
                    <span className="ml-2">{data.soa.record.expire}s</span>
                  </div>
                </div>
                {data.soa.record.validations.length > 0 && (
                  <div className="mt-3 space-y-1 pt-3 border-t border-gray-200">
                    {data.soa.record.validations.map((val, idx) => (
                      <ValidationItem key={idx} validation={val} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No SOA record found</p>
            )}
          </DNSSection>

          {/* MX Records */}
          <DNSSection
            title="Mail Exchange (MX)"
            icon={<Mail className="h-5 w-5" />}
            validations={data.mx.validations}
          >
            {data.mx.records.length > 0 ? (
              <div className="space-y-3">
                {data.mx.records.map((mx, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{mx.priority}</Badge>
                        <span className="font-mono text-sm font-medium">{mx.exchange}</span>
                      </div>
                      {mx.hasPTR && (
                        <Badge variant="success">PTR ✓</Badge>
                      )}
                    </div>
                    {mx.ip && mx.ip.length > 0 && (
                      <p className="text-xs text-gray-600 font-mono mb-2">{mx.ip.join(', ')}</p>
                    )}
                    {mx.ptrRecord && mx.ptrRecord.length > 0 && (
                      <p className="text-xs text-gray-600">
                        PTR: <span className="font-mono">{mx.ptrRecord.join(', ')}</span>
                      </p>
                    )}
                    {mx.validations.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {mx.validations.map((val, vidx) => (
                          <ValidationItem key={vidx} validation={val} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-sm text-blue-800">No MX records found. Domain is not configured for email.</p>
              </div>
            )}
          </DNSSection>

          {/* A/AAAA Records */}
          <DNSSection
            title="A & AAAA Records"
            icon={<Globe className="h-5 w-5" />}
            validations={data.a.validations}
          >
            {data.a.records.length > 0 ? (
              <div className="space-y-3">
                {data.a.records.map((record, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={record.type === 'A' ? 'info' : 'default'}>{record.type}</Badge>
                        <span className="font-mono text-sm font-medium">{record.ip}</span>
                      </div>
                      {record.hasPTR && (
                        <Badge variant="info">PTR ✓</Badge>
                      )}
                    </div>
                    {record.ttl && (
                      <p className="text-xs text-gray-600">TTL: {record.ttl}s</p>
                    )}
                    {record.ptrRecord && record.ptrRecord.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        PTR: <span className="font-mono">{record.ptrRecord.join(', ')}</span>
                      </p>
                    )}
                    {record.validations.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {record.validations.map((val, vidx) => (
                          <ValidationItem key={vidx} validation={val} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No A or AAAA records found</p>
            )}
          </DNSSection>

          {/* TXT Records */}
          <DNSSection
            title="TXT Records (SPF, DMARC, DKIM)"
            icon={<FileText className="h-5 w-5" />}
            validations={data.txt.validations}
          >
            {data.txt.records.length > 0 ? (
              <div className="space-y-3">
                {data.txt.records.map((txt, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant={txt.type === 'OTHER' ? 'default' : 'info'}>{txt.type}</Badge>
                      <p className="text-xs font-mono text-gray-700 break-all flex-1">{txt.value}</p>
                    </div>
                    {txt.validations.length > 0 && (
                      <div className="space-y-1">
                        {txt.validations.map((val, vidx) => (
                          <ValidationItem key={vidx} validation={val} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                <p className="text-sm text-yellow-800">No TXT records found. Consider adding SPF and DMARC for email security.</p>
              </div>
            )}
          </DNSSection>
        </div>
      )}
    </Card>
  );
}

// Helper Components

function DNSSummary({ summary }: { summary: DNSAnalysisResult['summary'] }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge variant="success">Excellent</Badge>;
    if (score >= 60) return <Badge variant="warning">Good</Badge>;
    return <Badge variant="error">Needs Improvement</Badge>;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="col-span-2 md:col-span-2">
          <p className="text-sm text-gray-600 mb-1">DNS Health Score</p>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-bold ${getScoreColor(summary.score)}`}>
              {summary.score}
            </span>
            <span className="text-gray-500">/100</span>
            {getScoreBadge(summary.score)}
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Passed</p>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xl font-semibold text-green-600">{summary.passed}</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Warnings</p>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-xl font-semibold text-yellow-600">{summary.warnings}</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Errors</p>
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-xl font-semibold text-red-600">{summary.errors}</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Info</p>
          <div className="flex items-center gap-1">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-xl font-semibold text-blue-600">{summary.info}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DNSSection({
  title,
  icon,
  validations,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  validations: ValidationResult[];
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-primary">{icon}</div>
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
      </div>

      {validations.length > 0 && (
        <div className="mb-3 space-y-1">
          {validations.map((val, idx) => (
            <ValidationItem key={idx} validation={val} />
          ))}
        </div>
      )}

      {children}
    </div>
  );
}

function ValidationItem({ validation }: { validation: ValidationResult }) {
  const getIcon = (level: ValidationLevel) => {
    switch (level) {
      case 'PASS':
        return <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />;
    }
  };

  const getBgColor = (level: ValidationLevel) => {
    switch (level) {
      case 'PASS':
        return 'bg-green-50 border-green-200';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200';
      case 'ERROR':
        return 'bg-red-50 border-red-200';
      case 'INFO':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = (level: ValidationLevel) => {
    switch (level) {
      case 'PASS':
        return 'text-green-800';
      case 'WARNING':
        return 'text-yellow-800';
      case 'ERROR':
        return 'text-red-800';
      case 'INFO':
        return 'text-blue-800';
    }
  };

  return (
    <div className={`flex items-start gap-2 p-2 rounded border ${getBgColor(validation.level)}`}>
      {getIcon(validation.level)}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${getTextColor(validation.level)}`}>
          {validation.message}
        </p>
        {validation.details && (
          <p className={`text-xs mt-0.5 ${getTextColor(validation.level)} opacity-80`}>
            {validation.details}
          </p>
        )}
      </div>
    </div>
  );
}
