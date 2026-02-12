import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hosting Checker - Complete Domain and DNS Analysis',
  description: 'Analyze any domain to get complete information about hosting provider, WHOIS, DNS records, geolocation, and more. Professional DNS analysis tool.',
  keywords: 'hosting checker, dns analysis, whois lookup, domain tools, reverse ip, dns records',
  authors: [{ name: 'Samuel López' }],
  openGraph: {
    title: 'Hosting Checker - Complete Domain and DNS Analysis',
    description: 'Professional tool for analyzing domain hosting, DNS records, and infrastructure',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <a href="/" className="flex items-center gap-3 group">
                  <img
                    src="https://daganet.net/wp-content/uploads/2024/09/cropped-logo-daganet-185x59.png"
                    alt="Daganet Logo"
                    className="h-12 w-auto group-hover:scale-105 transition-transform"
                  />
                  <div className="hidden sm:block">
                    <h1 className="text-xl font-bold text-gray-900">Hosting Checker</h1>
                    <p className="text-xs text-gray-600">Complete Domain Analysis</p>
                  </div>
                </a>

                <nav className="hidden md:flex items-center gap-6">
                  <a
                    href="/"
                    className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                  >
                    Home
                  </a>
                  <a
                    href="https://daganet.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                  >
                    Daganet
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-sm text-gray-600">
                    Professional tool for analyzing domain hosting, DNS records, and infrastructure.
                    Get complete information in seconds.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Features</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Hosting Provider Detection</li>
                    <li>• WHOIS Information</li>
                    <li>• Reverse IP Lookup</li>
                    <li>• DNS Analysis (NS, SOA, MX, A, TXT)</li>
                    <li>• SSL & Health Check</li>
                    <li>• Geolocation</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Daganet</h3>
                  <p className="text-sm text-gray-600">
                    Professional hosting and domain analysis tool.
                    Built with Next.js 14, TypeScript, and TailwindCSS.
                  </p>
                  <div className="mt-4">
                    <a
                      href="https://daganet.net"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Visit Daganet.net →
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  © {new Date().getFullYear()} Daganet. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
