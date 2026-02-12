/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env: {
    IPINFO_TOKEN: process.env.IPINFO_TOKEN,
    HACKERTARGET_API_KEY: process.env.HACKERTARGET_API_KEY,
  },
}

module.exports = nextConfig
