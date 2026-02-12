import { Network, Globe, AlertTriangle } from 'lucide-react';
import { Card, CardRow } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ReverseIPInfo } from '@/lib/types';
import { getHostingType } from '@/lib/utils/helpers';

interface ReverseIPCardProps {
  data?: ReverseIPInfo;
  loading?: boolean;
  error?: string;
}

export function ReverseIPCard({ data, loading, error }: ReverseIPCardProps) {
  const getHostingTypeBadge = (count: number) => {
    if (count === 0 || count === 1) {
      return <Badge variant="success">Dedicated/VPS</Badge>;
    } else if (count <= 5) {
      return <Badge variant="info">Small Shared</Badge>;
    } else if (count <= 50) {
      return <Badge variant="warning">Medium Shared</Badge>;
    } else {
      return <Badge variant="error">Large Shared</Badge>;
    }
  };

  return (
    <Card
      title="Reverse IP Lookup"
      subtitle="Domains sharing the same IP"
      icon={<Network className="h-6 w-6" />}
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-3">
          <CardRow label="IP Address" value={<span className="font-mono">{data.ip}</span>} mono />

          <CardRow
            label="Total Domains"
            value={
              <div className="flex items-center gap-2">
                <span className="font-semibold">{data.totalDomains}</span>
                {getHostingTypeBadge(data.totalDomains)}
              </div>
            }
          />

          <CardRow label="Hosting Type" value={getHostingType(data)} />

          {data.limited && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Results limited to {data.domains.length} domains
              </p>
            </div>
          )}

          {data.domains.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Domains on this IP ({data.domains.length})
              </p>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {data.domains.map((domain, idx) => (
                  <p key={idx} className="text-sm font-mono text-gray-700 pl-6 py-1 hover:bg-gray-50 rounded">
                    {domain}
                  </p>
                ))}
              </div>
            </div>
          )}

          {data.totalDomains === 0 && (
            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
              <p className="text-sm text-green-800">
                No other domains found on this IP. This suggests dedicated hosting or VPS.
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            Source: {data.source}
          </div>
        </div>
      )}
    </Card>
  );
}
