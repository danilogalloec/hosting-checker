'use client';

import { useState } from 'react';
import { Search, MapPin, Globe, Server, Activity } from 'lucide-react';
import { GeolocationInfo } from '@/lib/types';

export default function IpAnalysisTool() {
    const [ip, setIp] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GeolocationInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ip) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch('/api/ip-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Error analyzing IP');
            }

            setResult(data.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-[#0056b3] p-6 text-white">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="h-6 w-6" />
                        IP Analysis Tool
                    </h2>
                    <p className="opacity-90 mt-1">
                        Get detailed geolocation and ISP information for any IP address
                    </p>
                </div>

                <div className="p-6">
                    {/* Search Form */}
                    <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
                        <input
                            type="text"
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            placeholder="Enter IP address (e.g., 8.8.8.8)"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056b3] focus:border-transparent outline-none transition-all"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-[#0056b3] text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            ) : (
                                <Search className="h-5 w-5" />
                            )}
                            Analyze
                        </button>
                    </form>

                    {error && (
                        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Results Section */}
                    {result && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Location Card */}
                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <MapPin className="h-5 w-5 text-[#0056b3]" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Location Details</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">Country</span>
                                        <span className="font-medium">{result.countryName || result.country}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">Region</span>
                                        <span className="font-medium">{result.region || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">City</span>
                                        <span className="font-medium">{result.city || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Timezone</span>
                                        <span className="font-medium">{result.timezone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Network Card */}
                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Server className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Network Info</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">ISP</span>
                                        <span className="font-medium">{result.isp || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">Organization</span>
                                        <span className="font-medium">{result.org || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">AS Number</span>
                                        <span className="font-medium">{result.as || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">IP</span>
                                        <span className="font-medium">{result.ip}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
