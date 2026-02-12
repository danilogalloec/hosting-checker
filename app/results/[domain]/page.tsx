'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SearchForm } from '@/components/ui/SearchForm';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { HostingProviderCard } from '@/components/results/HostingProviderCard';
import { WhoisInfoCard } from '@/components/results/WhoisInfoCard';
import { ReverseIPCard } from '@/components/results/ReverseIPCard';
import { GeolocationCard } from '@/components/results/GeolocationCard';
import { HealthCheckCard } from '@/components/results/HealthCheckCard';
import { DNSAnalysisCard } from '@/components/results/DNSAnalysisCard';
import {
  HostingProviderInfo,
  WhoisInfo,
  ReverseIPInfo,
  GeolocationInfo,
  HealthCheckInfo,
  DNSAnalysisResult,
  ApiResponse,
} from '@/lib/types';
import { ArrowLeft, RefreshCcw } from 'lucide-react';

interface ResultsState {
  hostingProvider?: HostingProviderInfo;
  whois?: WhoisInfo;
  reverseIP?: ReverseIPInfo;
  geolocation?: GeolocationInfo;
  healthCheck?: HealthCheckInfo;
  dnsAnalysis?: DNSAnalysisResult;
}

interface LoadingState {
  hostingProvider: boolean;
  whois: boolean;
  reverseIP: boolean;
  geolocation: boolean;
  healthCheck: boolean;
  dnsAnalysis: boolean;
}

interface ErrorState {
  hostingProvider?: string;
  whois?: string;
  reverseIP?: string;
  geolocation?: string;
  healthCheck?: string;
  dnsAnalysis?: string;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const domain = decodeURIComponent(params.domain as string);

  const [results, setResults] = useState<ResultsState>({});
  const [loading, setLoading] = useState<LoadingState>({
    hostingProvider: true,
    whois: true,
    reverseIP: true,
    geolocation: true,
    healthCheck: true,
    dnsAnalysis: true,
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [globalError, setGlobalError] = useState<string>('');

  useEffect(() => {
    fetchAllData();
  }, [domain]);

  const fetchAllData = async () => {
    setGlobalError('');

    // Reset loading states
    setLoading({
      hostingProvider: true,
      whois: true,
      reverseIP: true,
      geolocation: true,
      healthCheck: true,
      dnsAnalysis: true,
    });

    setErrors({});

    // Fetch all APIs in parallel
    await Promise.all([
      fetchHostingProvider(),
      fetchWhois(),
      fetchReverseIP(),
      fetchGeolocation(),
      fetchHealthCheck(),
      fetchDNSAnalysis(),
    ]);
  };

  const fetchAPI = async <T,>(
    endpoint: string,
    key: keyof ResultsState
  ): Promise<void> => {
    try {
      const response = await fetch(
        `/api/${endpoint}?domain=${encodeURIComponent(domain)}`
      );

      const data: ApiResponse<T> = await response.json();

      if (response.status === 429) {
        setErrors((prev) => ({
          ...prev,
          [key]: 'Rate limit exceeded. Please try again later.',
        }));
        return;
      }

      if (!response.ok || !data.success) {
        setErrors((prev) => ({
          ...prev,
          [key]: data.error || 'Failed to fetch data',
        }));
        return;
      }

      setResults((prev) => ({ ...prev, [key]: data.data }));
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        [key]: error.message || 'Network error',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const fetchHostingProvider = () =>
    fetchAPI<HostingProviderInfo>('hosting-provider', 'hostingProvider');

  const fetchWhois = () => fetchAPI<WhoisInfo>('whois', 'whois');

  const fetchReverseIP = () => fetchAPI<ReverseIPInfo>('reverse-ip', 'reverseIP');

  const fetchGeolocation = () =>
    fetchAPI<GeolocationInfo>('geolocation', 'geolocation');

  const fetchHealthCheck = () =>
    fetchAPI<HealthCheckInfo>('health-check', 'healthCheck');

  const fetchDNSAnalysis = () =>
    fetchAPI<DNSAnalysisResult>('dns-analysis', 'dnsAnalysis');

  const handleNewSearch = (newDomain: string) => {
    router.push(`/results/${encodeURIComponent(newDomain)}`);
  };

  const isAllLoading = Object.values(loading).every((l) => l);

  return (
    <div className="space-y-8">
      {/* Header with Search */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Analysis Results
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Domain: <span className="font-mono font-medium">{domain}</span>
            </p>
          </div>
          <button
            onClick={fetchAllData}
            disabled={isAllLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh data"
          >
            <RefreshCcw
              className={`h-5 w-5 text-gray-600 ${isAllLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        <SearchForm onSubmit={handleNewSearch} />
      </div>

      {/* Global Error */}
      {globalError && (
        <ErrorAlert
          message={globalError}
          onClose={() => setGlobalError('')}
        />
      )}

      {/* All Loading State */}
      {isAllLoading && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12">
          <LoadingSpinner size="lg" text="Analyzing domain..." />
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              This may take a few seconds. We're fetching:
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {[
                'Hosting Provider',
                'WHOIS',
                'Reverse IP',
                'Geolocation',
                'Health Check',
                'DNS Analysis',
              ].map((item) => (
                <span
                  key={item}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {!isAllLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Row 1 */}
          <HostingProviderCard
            data={results.hostingProvider}
            loading={loading.hostingProvider}
            error={errors.hostingProvider}
          />

          <WhoisInfoCard
            data={results.whois}
            loading={loading.whois}
            error={errors.whois}
          />

          {/* Row 2 */}
          <ReverseIPCard
            data={results.reverseIP}
            loading={loading.reverseIP}
            error={errors.reverseIP}
          />

          <GeolocationCard
            data={results.geolocation}
            loading={loading.geolocation}
            error={errors.geolocation}
          />

          {/* Row 3 */}
          <HealthCheckCard
            data={results.healthCheck}
            loading={loading.healthCheck}
            error={errors.healthCheck}
          />

          {/* DNS Analysis - Full Width */}
          <div className="lg:col-span-2">
            <DNSAnalysisCard
              data={results.dnsAnalysis}
              loading={loading.dnsAnalysis}
              error={errors.dnsAnalysis}
            />
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> All data is cached for improved performance. Results may be cached
          for a few minutes to reduce load on external services.
        </p>
      </div>
    </div>
  );
}
