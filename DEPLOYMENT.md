# Deployment Guide

## Local Development

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

### Environment Variables

Edit `.env.local` with your API keys (optional but recommended for higher limits):

```bash
# Get free API keys:
# - IPInfo.io: https://ipinfo.io/signup (50k req/mes)
# - HackerTarget: https://hackertarget.com/api/ (500 req/día)

IPINFO_TOKEN=your_token_here
HACKERTARGET_API_KEY=your_key_here
```

## Production Deployment

### Option 1: Docker (Recommended)

#### Build and Run with Docker Compose

```bash
# 1. Clone repository
git clone <repo-url>
cd hosting-checker

# 2. Configure environment
cp .env.example .env
nano .env  # Add your API keys

# 3. Build and start
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Stop
docker-compose down
```

#### Manual Docker Build

```bash
# Build image
docker build -f docker/Dockerfile -t hosting-checker .

# Run container
docker run -d \
  --name hosting-checker \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  hosting-checker

# View logs
docker logs -f hosting-checker
```

### Option 2: VPS Deployment (Hetzner)

#### Prerequisites

- VPS with Docker installed
- Domain name pointed to VPS IP
- SSH access

#### Steps

1. **Connect to VPS**

```bash
ssh user@your-server-ip
```

2. **Install Docker** (if not installed)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

3. **Clone and Setup**

```bash
cd /opt
sudo git clone <repo-url> hosting-checker
cd hosting-checker
sudo cp .env.example .env
sudo nano .env  # Configure environment
```

4. **Start Application**

```bash
sudo docker-compose up -d
```

5. **Configure Nginx Reverse Proxy**

```bash
sudo nano /etc/nginx/sites-available/hosting-checker
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/hosting-checker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

6. **SSL with Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

7. **Auto-renewal**

```bash
sudo certbot renew --dry-run
```

#### Updates

```bash
cd /opt/hosting-checker
sudo git pull
sudo docker-compose down
sudo docker-compose build
sudo docker-compose up -d
```

### Option 3: Vercel / Netlify

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

Add environment variables in Vercel Dashboard:
- Project Settings → Environment Variables
- Add all variables from .env.example

#### Notes

- Some functionality may be limited on serverless platforms
- Ping functionality might not work in serverless environments
- Consider using Docker for full functionality

## Monitoring

### Health Check

```bash
curl http://localhost:3000/
```

### View Logs

```bash
# Docker Compose
docker-compose logs -f

# Docker
docker logs -f hosting-checker

# System (if running with npm)
pm2 logs hosting-checker
```

### Cache Stats

Check cache performance in application logs:
```
[Cache] Cleaned X expired entries
```

### Rate Limiting

Monitor rate limit in response headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1699999999
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### Docker Build Issues

```bash
# Clean build
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### DNS Resolution Issues

Make sure the container has network access:
```bash
docker exec hosting-checker ping google.com
```

### Memory Issues

Increase Docker memory:
```bash
# docker-compose.yml
services:
  hosting-checker:
    mem_limit: 1g
    mem_reservation: 512m
```

## Performance Optimization

### Caching

Adjust cache TTL in `.env`:
```bash
CACHE_TTL_WHOIS=86400      # 24 hours
CACHE_TTL_GEO=604800       # 7 days
CACHE_TTL_REVERSE_IP=3600  # 1 hour
CACHE_TTL_HEALTH=300       # 5 minutes
CACHE_TTL_DNS_ANALYSIS=1800 # 30 minutes
```

### Rate Limiting

Adjust rate limits:
```bash
RATE_LIMIT_MAX=20          # 20 requests
RATE_LIMIT_WINDOW_MS=60000 # per minute
```

### Resource Usage

**Recommended VPS Specs:**
- 2 vCPU
- 4GB RAM
- 40GB SSD
- Cost: ~5-10 EUR/month

## Security

### Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### Regular Updates

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Docker images
cd /opt/hosting-checker
sudo docker-compose pull
sudo docker-compose up -d
```

### Backups

```bash
# Backup environment
sudo cp .env .env.backup

# Backup Docker volumes
docker run --rm \
  -v hosting-checker_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/data-backup.tar.gz /data
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-repo/issues
- Documentation: README.md
