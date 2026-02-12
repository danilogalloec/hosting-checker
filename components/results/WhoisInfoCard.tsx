import { FileText, Calendar, Shield, Server } from 'lucide-react';
import { Card, CardRow } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { WhoisInfo } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';

interface WhoisInfoCardProps {
  data?: WhoisInfo;
  loading?: boolean;
  error?: string;
}

export function WhoisInfoCard({ data, loading, error }: WhoisInfoCardProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const expiryDate = new Date(dateStr);
      const now = new Date();
      const daysUntil = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        return <Badge variant="error">Expired</Badge>;
      } else if (daysUntil <= 30) {
        return <Badge variant="warning">Expires in {daysUntil} days</Badge>;
      } else {
        return <Badge variant="success">{daysUntil} days remaining</Badge>;
      }
    } catch {
      return null;
    }
  };

  return (
    <Card
      title="WHOIS Information"
      subtitle="Domain registration details"
      icon={<FileText className="h-6 w-6" />}
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-1">
          {data.registrar && (
            <CardRow label="Registrar" value={data.registrar} />
          )}

          {data.createdDate && (
            <CardRow
              label="Created"
              value={
                <div className="flex flex-col items-end gap-1">
                  <span>{formatDate(data.createdDate)}</span>
                  <span className="text-xs text-gray-500">
                    ({formatDistanceToNow(new Date(data.createdDate), { addSuffix: true })})
                  </span>
                </div>
              }
            />
          )}

          {data.updatedDate && (
            <CardRow
              label="Updated"
              value={formatDate(data.updatedDate)}
            />
          )}

          {data.expiryDate && (
            <CardRow
              label="Expires"
              value={
                <div className="flex flex-col items-end gap-1">
                  <span>{formatDate(data.expiryDate)}</span>
                  {getExpiryStatus(data.expiryDate)}
                </div>
              }
            />
          )}

          {data.nameservers && data.nameservers.length > 0 && (
            <div className="pt-3 mt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Server className="h-4 w-4" />
                Nameservers ({data.nameservers.length})
              </p>
              <div className="space-y-1">
                {data.nameservers.map((ns, idx) => (
                  <p key={idx} className="text-sm font-mono text-gray-700 pl-6">
                    {ns}
                  </p>
                ))}
              </div>
            </div>
          )}

          {data.status && data.status.length > 0 && (
            <div className="pt-3 mt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Status
              </p>
              <div className="flex flex-wrap gap-1">
                {data.status.map((status, idx) => (
                  <Badge key={idx} variant="default">
                    {status}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.dnssec && (
            <CardRow label="DNSSEC" value={data.dnssec} />
          )}
        </div>
      )}
    </Card>
  );
}
