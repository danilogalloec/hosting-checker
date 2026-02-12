import { Server, MapPin, Network } from 'lucide-react';
import { Card, CardRow } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { HostingProviderInfo } from '@/lib/types';

interface HostingProviderCardProps {
  data?: HostingProviderInfo;
  loading?: boolean;
  error?: string;
}

export function HostingProviderCard({ data, loading, error }: HostingProviderCardProps) {
  const confidenceColor = {
    high: 'success',
    medium: 'warning',
    low: 'error',
  } as const;

  return (
    <Card
      title="Hosting Provider"
      subtitle="Infrastructure and hosting information"
      icon={<Server className="h-6 w-6" />}
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-1">
          <CardRow
            label="Provider"
            value={
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">{data.provider}</span>
                <Badge variant={confidenceColor[data.confidence]}>
                  {data.confidence}
                </Badge>
              </div>
            }
          />

          <CardRow label="Organization" value={data.organization} />

          <CardRow label="IP Address" value={<span className="font-mono">{data.ip}</span>} mono />

          {data.asn && (
            <CardRow label="ASN" value={data.asn} mono />
          )}

          {data.asnNumber && (
            <CardRow label="ASN Number" value={data.asnNumber} />
          )}

          {data.network && (
            <CardRow label="Network" value={data.network} mono />
          )}

          {data.country && (
            <CardRow
              label="Country"
              value={
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  {data.country}
                </div>
              }
            />
          )}
        </div>
      )}
    </Card>
  );
}
