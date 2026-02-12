import { Activity, CheckCircle2, XCircle, AlertCircle, Lock, Clock, Server } from 'lucide-react';
import { Card, CardRow } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { HealthCheckInfo } from '@/lib/types';
import { format } from 'date-fns';

interface HealthCheckCardProps {
  data?: HealthCheckInfo;
  loading?: boolean;
  error?: string;
}

export function HealthCheckCard({ data, loading, error }: HealthCheckCardProps) {
  const getStatusBadge = (status: HealthCheckInfo['status']) => {
    switch (status) {
      case 'online':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Online
          </Badge>
        );
      case 'offline':
        return (
          <Badge variant="error" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Offline
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="error" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
    }
  };

  const getResponseTimeColor = (ms?: number) => {
    if (!ms) return 'text-gray-700';
    if (ms < 200) return 'text-green-600';
    if (ms < 500) return 'text-blue-600';
    if (ms < 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card
      title="Health Check"
      subtitle="Website status and performance"
      icon={<Activity className="h-6 w-6" />}
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-3">
          <CardRow
            label="Status"
            value={getStatusBadge(data.status)}
          />

          {data.httpStatus && (
            <CardRow
              label="HTTP Status"
              value={
                <Badge variant={data.httpStatus < 400 ? 'success' : 'error'}>
                  {data.httpStatus}
                </Badge>
              }
            />
          )}

          {data.responseTime && (
            <CardRow
              label="Response Time"
              value={
                <span className={`font-semibold ${getResponseTimeColor(data.responseTime)}`}>
                  {data.responseTime} ms
                </span>
              }
            />
          )}

          {data.pingTime && (
            <CardRow
              label="Ping Time"
              value={
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{data.pingTime.toFixed(1)} ms</span>
                </div>
              }
            />
          )}

          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              SSL Certificate
            </p>

            {data.ssl.enabled ? (
              <div className="space-y-1 pl-6">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant={data.ssl.valid ? 'success' : 'error'}>
                    {data.ssl.valid ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>

                {data.ssl.issuer && (
                  <div className="flex justify-between items-start py-1">
                    <span className="text-sm text-gray-600">Issuer</span>
                    <span className="text-sm text-gray-900 text-right">{data.ssl.issuer}</span>
                  </div>
                )}

                {data.ssl.validFrom && (
                  <div className="flex justify-between items-start py-1">
                    <span className="text-sm text-gray-600">Valid From</span>
                    <span className="text-sm text-gray-900">
                      {format(new Date(data.ssl.validFrom), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}

                {data.ssl.validTo && (
                  <div className="flex justify-between items-start py-1">
                    <span className="text-sm text-gray-600">Valid Until</span>
                    <span className="text-sm text-gray-900">
                      {format(new Date(data.ssl.validTo), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}

                {data.ssl.daysUntilExpiry !== undefined && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Expires In</span>
                    <Badge variant={data.ssl.daysUntilExpiry > 30 ? 'success' : 'warning'}>
                      {data.ssl.daysUntilExpiry} days
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 pl-6">
                No SSL certificate detected
              </p>
            )}
          </div>

          {data.serverHeader && (
            <CardRow
              label="Server"
              value={
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-gray-500" />
                  {data.serverHeader}
                </div>
              }
            />
          )}

          {data.redirects !== undefined && data.redirects > 0 && (
            <CardRow label="Redirects" value={data.redirects} />
          )}

          {data.finalUrl && data.finalUrl !== data.url && (
            <CardRow label="Final URL" value={data.finalUrl} />
          )}

          {data.error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mt-3">
              <p className="text-sm text-red-800">{data.error}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
