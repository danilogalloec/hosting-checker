import HomeContainer from '@/components/HomeContainer';
import { Server, Globe, Shield, Activity, Network, MapPin } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <HomeContainer />

      {/* Features Grid */}
      <section className="py-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          What You&apos;ll Get
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Server className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Hosting Provider
            </h3>
            <p className="text-sm text-gray-600">
              Identify the hosting provider, ASN, organization, and infrastructure details
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              WHOIS Information
            </h3>
            <p className="text-sm text-gray-600">
              Registration details, expiry date, registrar, nameservers, and domain status
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Network className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              DNS Analysis
            </h3>
            <p className="text-sm text-gray-600">
              Complete DNS check: NS, SOA, MX, A/AAAA, TXT records with professional validation
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reverse IP Lookup
            </h3>
            <p className="text-sm text-gray-600">
              Discover other domains hosted on the same IP address
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Geolocation
            </h3>
            <p className="text-sm text-gray-600">
              Physical location, coordinates, timezone, and ISP information
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Health Check
            </h3>
            <p className="text-sm text-gray-600">
              Website status, response time, SSL certificate validation, and uptime
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Analyze?
        </h2>
        <p className="text-lg mb-8 opacity-90">
          Enter any domain above to get instant, comprehensive analysis
        </p>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Instant Results</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Free to Use</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>No Registration</span>
          </div>
        </div>
      </section>
    </div>
  );
}
