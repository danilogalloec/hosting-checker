# Hosting Checker Tool

Herramienta web completa para análisis de hosting y DNS, similar a hostingchecker.com + intodns.com.

## Características

- ✅ **Identificación de proveedor de hosting** - Detecta AWS, GCP, Hetzner, DigitalOcean, etc.
- ✅ **Información WHOIS completa** - Registrador, fechas, nameservers, status
- ✅ **Reverse IP Lookup** - Dominios que comparten la misma IP
- ✅ **Geolocalización** - Ubicación física del servidor
- ✅ **Health Check** - Estado del sitio, SSL, ping, response time
- ✅ **Análisis DNS profesional** - NS, SOA, MX, A/AAAA, TXT, PTR con validaciones

## Stack Tecnológico

- **Next.js 14+** con App Router
- **TypeScript**
- **TailwindCSS**
- **Docker + Docker Compose**

## Instalación

### Desarrollo Local

```bash
# Clonar repositorio
git clone <repo-url>
cd hosting-checker

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus API keys

# Modo desarrollo
npm run dev

# Abrir en navegador
# http://localhost:3000
```

### Producción con Docker

```bash
# Configurar variables de entorno
cp .env.example .env

# Levantar con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

## Configuración

### Variables de Entorno

```bash
# API Keys (opcionales pero recomendadas para mayor límite)
IPINFO_TOKEN=your_token_here          # https://ipinfo.io
HACKERTARGET_API_KEY=your_key_here    # https://hackertarget.com

# Rate Limiting
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW_MS=60000

# Cache TTL (en segundos)
CACHE_TTL_WHOIS=86400
CACHE_TTL_GEO=604800
CACHE_TTL_REVERSE_IP=3600
CACHE_TTL_HEALTH=300
CACHE_TTL_DNS_ANALYSIS=1800

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### APIs Externas

| Servicio | Plan Gratuito | Documentación |
|----------|---------------|---------------|
| IPInfo.io | 50k req/mes | https://ipinfo.io/developers |
| HackerTarget | 500 req/día | https://hackertarget.com/api/ |
| ipapi.co | 1k req/día | https://ipapi.co/api/ |

## Arquitectura

```
app/
├── api/                 # API Routes
│   ├── hosting-provider/
│   ├── whois/
│   ├── reverse-ip/
│   ├── geolocation/
│   ├── health-check/
│   └── dns-analysis/
├── results/[domain]/    # Página de resultados
└── page.tsx            # Página principal

components/
├── ui/                 # Componentes base
└── results/            # Cards de resultados

lib/
├── services/           # Lógica de negocio
├── utils/              # Utilidades
└── types/              # TypeScript types
```

## Uso

1. **Ingresar dominio**: Escribe el dominio a analizar (ej: google.com)
2. **Resultados automáticos**: Se muestran 6 cards con información completa:
   - Hosting Provider
   - WHOIS Info
   - Reverse IP
   - Geolocation
   - Health Check
   - DNS Analysis (con sistema Pass/Warning/Error/Info)

## Deployment en VPS Hetzner

### Requisitos
- VPS con Docker instalado
- Nginx como reverse proxy
- Certbot para SSL

### Pasos

1. **Clonar proyecto**
```bash
ssh user@your-server
git clone <repo-url> /opt/hosting-checker
cd /opt/hosting-checker
```

2. **Configurar variables**
```bash
cp .env.example .env
nano .env
```

3. **Levantar con Docker**
```bash
docker-compose up -d
```

4. **Configurar Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

5. **SSL con Certbot**
```bash
sudo certbot --nginx -d your-domain.com
```

## Desarrollo

### Agregar nuevo servicio

1. Crear servicio en `lib/services/myService.ts`
2. Crear API route en `app/api/my-service/route.ts`
3. Crear componente card en `components/results/MyServiceCard.tsx`
4. Integrar en página de resultados

### Estructura de un servicio

```typescript
// lib/services/myService.ts
export async function getMyData(domain: string) {
  try {
    // Lógica del servicio
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## Licencia

MIT

## Autor

Samuel López
