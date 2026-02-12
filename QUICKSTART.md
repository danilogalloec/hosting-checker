# Quick Start Guide

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

## Test the Application

Try analyzing these domains:
- `google.com` - Large infrastructure
- `github.com` - Well-configured DNS
- `cloudflare.com` - CDN provider
- `hetzner.com` - Hosting provider

## What to Expect

The tool will fetch and display:

1. **Hosting Provider** - AWS, GCP, Hetzner, etc.
2. **WHOIS Information** - Registration details, expiry, nameservers
3. **Reverse IP** - Other domains on the same IP
4. **Geolocation** - Physical server location
5. **Health Check** - Website status, SSL, response time
6. **DNS Analysis** - Complete DNS validation with Pass/Warning/Error/Info

## Optional API Keys

For higher rate limits, add these to `.env.local`:

```bash
# IPInfo.io - 50,000 requests/month free
# Get at: https://ipinfo.io/signup
IPINFO_TOKEN=your_token_here

# HackerTarget - 500 requests/day free
# Get at: https://hackertarget.com/api/
HACKERTARGET_API_KEY=your_key_here
```

Without API keys, the app still works but with lower limits.

## Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Docker Deployment

```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Common Issues

### 1. Port 3000 already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### 2. DNS lookup failures

This is normal for some domains. The app handles errors gracefully.

### 3. Rate limit exceeded

If you see "Rate limit exceeded", wait 1 minute or add API keys to `.env.local`.

## Architecture

```
app/
├── api/              # 6 API endpoints
│   ├── hosting-provider/
│   ├── whois/
│   ├── reverse-ip/
│   ├── geolocation/
│   ├── health-check/
│   └── dns-analysis/
├── results/[domain]/ # Results page
└── page.tsx         # Home page

lib/
├── services/        # Backend logic (6 services)
├── utils/          # Cache, rate limiting, validation
└── types/          # TypeScript types

components/
├── ui/             # Reusable components
└── results/        # 6 result cards
```

## Features

✅ **Hosting Provider Detection** - Identifies AWS, GCP, Hetzner, and more
✅ **WHOIS Lookup** - Registration info, expiry dates, nameservers
✅ **Reverse IP** - Finds domains sharing the same IP
✅ **Geolocation** - Physical location with map coordinates
✅ **Health Check** - HTTP status, SSL validation, response time
✅ **Professional DNS Analysis** - NS, SOA, MX, A/AAAA, TXT with validations
✅ **Smart Caching** - Reduces API calls and improves performance
✅ **Rate Limiting** - Prevents abuse (10 requests/minute by default)

## Performance

- **Caching**: Results cached for 5-30 minutes depending on data type
- **Parallel Requests**: All 6 APIs fetched simultaneously
- **Rate Limiting**: 10 requests/minute per IP (configurable)

## Security

- Input validation with Zod
- XSS protection
- Rate limiting
- No data storage (privacy-friendly)

## Next Steps

1. **Customize**: Edit components in `components/results/`
2. **Add Features**: Create new services in `lib/services/`
3. **Deploy**: Follow `DEPLOYMENT.md` for production setup
4. **Extend**: Add more DNS checks, monitoring, etc.

## Support

- Documentation: `README.md`
- Deployment: `DEPLOYMENT.md`
- Issues: GitHub Issues

---

Built with Next.js 14, TypeScript, and TailwindCSS
