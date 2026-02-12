import { MapPin, Globe2, Clock } from 'lucide-react';
import { Card, CardRow } from '../ui/Card';
import { GeolocationInfo } from '@/lib/types';

interface GeolocationCardProps {
  data?: GeolocationInfo;
  loading?: boolean;
  error?: string;
}

export function GeolocationCard({ data, loading, error }: GeolocationCardProps) {
  const getGoogleMapsUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  return (
    <Card
      title="Server Location"
      subtitle="Geographic information"
      icon={<Globe2 className="h-6 w-6" />}
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-1">
          <CardRow label="IP Address" value={<span className="font-mono">{data.ip}</span>} mono />

          {data.city && (
            <CardRow
              label="City"
              value={
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  {data.city}
                </div>
              }
            />
          )}

          {data.region && (
            <CardRow label="Region" value={data.region} />
          )}

          {data.countryName && (
            <CardRow label="Country" value={`${data.countryName} (${data.countryCode})`} />
          )}

          {data.continent && (
            <CardRow label="Continent" value={data.continent} />
          )}

          {data.latitude && data.longitude && (
            <CardRow
              label="Coordinates"
              value={
                <a
                  href={getGoogleMapsUrl(data.latitude, data.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-mono"
                >
                  {data.latitude.toFixed(4)}, {data.longitude.toFixed(4)}
                </a>
              }
            />
          )}

          {data.timezone && (
            <CardRow
              label="Timezone"
              value={
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  {data.timezone}
                </div>
              }
            />
          )}

          {data.postal && (
            <CardRow label="Postal Code" value={data.postal} />
          )}

          {data.isp && (
            <div className="pt-3 mt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-600 mb-1">ISP / Organization</p>
              <p className="text-sm text-gray-700">{data.isp}</p>
            </div>
          )}

          {data.as && (
            <CardRow label="AS" value={data.as} mono />
          )}

          {data.asName && (
            <CardRow label="AS Name" value={data.asName} />
          )}
        </div>
      )}
    </Card>
  );
}
