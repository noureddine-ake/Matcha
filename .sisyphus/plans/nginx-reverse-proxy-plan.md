# Nginx Reverse Proxy Implementation Plan

## 📋 Plan Overview

| Item | Details |
|------|---------|
| **Objective** | Add Nginx container as reverse proxy for unified entry point |
| **Current State** | Services exposed directly to host (ports 3000, 5000) |
| **Target State** | Single entry point (port 80) routing to appropriate services |
| **Files to Create** | `nginx/Dockerfile`, `nginx/nginx.conf`, `nginx/default.conf` |
| **Files to Modify** | `docker-compose.yml`, `docker-compose.prod.yml` |

---

## 🔍 DevOps Logic Analysis

### Current Architecture (Before)

```
┌─────────────────────────────────────────────────────────────┐
│                         HOST MACHINE                        │
│                                                             │
│   ┌──────────┐     ┌─────────────┐     ┌───────────────┐  │
│   │ :3000    │     │ :5000       │     │ :5431 :6380   │  │
│   │ frontend │     │ backend     │     │ postgres redis│  │
│   │ (Next.js)│     │ (Express)   │     │               │  │
│   └────┬─────┘     └──────┬──────┘     └───────┬───────┘  │
│        │                  │                      │          │
│        │                  │                      │          │
│   Direct exposure     Direct exposure        Internal only  │
│   No unified entry   No SSL                  No access       │
│   No security headers                         │              │
└─────────────────────────────────────────────────────────────┘
            ↑                    ↑                   ↑
        Browser             API Client            Internal
```

**Problems Identified:**

| # | Problem | Impact |
|---|---------|--------|
| 1 | Multiple entry points | Complex client configuration, CORS issues |
| 2 | No SSL termination | Security vulnerability in production |
| 3 | No centralized security headers | XSS, clickjacking risks |
| 4 | No rate limiting | DDoS susceptibility |
| 5 | No gzip compression | Increased bandwidth costs |
| 6 | No static file caching | Slower page loads |
| 7 | No load balancing | Single point of failure in scaled scenarios |
| 8 | Direct backend exposure | Backend vulnerabilities exposed |

### Target Architecture (After)

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOST MACHINE                            │
│                                                                 │
│                          ┌──────────────┐                        │
│                          │   :80        │  ← Single Entry      │
│                          │   nginx      │    (reverse proxy)   │
│                          └──────┬───────┘                      │
│                                 │                               │
│            ┌────────────────────┼────────────────────┐          │
│            │                    │                    │          │
│      ┌─────┴─────┐       ┌─────┴─────┐       ┌──────┴─────┐    │
│      │ /api/*    │       │ /*        │       │ Internal  │    │
│      │           │       │ (SPA)     │       │ Services  │    │
│      │ backend   │       │ frontend  │       │           │    │
│      │ :5000     │       │ :3000     │       │ postgres  │    │
│      └───────────┘       └───────────┘       │ redis     │    │
│                                                └───────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Problems Solved:**

| # | Before | After |
|---|--------|-------|
| 1 | Multiple ports | Single port 80 |
| 2 | No SSL | Ready for SSL (443) |
| 3 | No security headers | HSTS, X-Frame-Options, etc. |
| 4 | No rate limiting | Configurable rate limits |
| 5 | No compression | Gzip enabled |
| 6 | No caching | Static files cached |
| 7 | Direct exposure | Backend internal-only |
| 8 | CORS issues | Unified origin |

---

## 📝 Implementation Plan

### Step 1: Create Nginx Directory Structure

```
nginx/
├── Dockerfile          # Nginx container definition
├── nginx.conf          # Main nginx configuration
└── conf.d/
    └── default.conf   # Site-specific configuration
```

### Step 2: Create Nginx Dockerfile

**File:** `nginx/Dockerfile`

```dockerfile
FROM nginx:1.25-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d /etc/nginx/conf.d

# Create directories for logs and certificates
RUN mkdir -p /var/log/nginx /etc/nginx/ssl

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 3: Create Main Nginx Configuration

**File:** `nginx/nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format with upstream timing
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/xml application/xml+rss text/javascript application/x-javascript;

    # Security headers (base settings)
    server_tokens off;

    # Include site-specific configurations
    include /etc/nginx/conf.d/*.conf;
}
```

### Step 4: Create Site Configuration

**File:** `nginx/conf.d/default.conf`

```nginx
upstream backend {
    server backend:5000;
    keepalive 32;
}

upstream frontend {
    server frontend:3000;
    keepalive 16;
}

server {
    listen 80;
    server_name localhost;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting zone
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API routes → Backend
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;

        # Connection headers
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 16k;
        proxy_busy_buffers_size 24k;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 86400;
    }

    # Static files → Next.js (handled efficiently)
    location /_next/static/ {
        proxy_pass http://frontend;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }

    location /static/ {
        proxy_pass http://frontend;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Everything else → Frontend (SPA fallback)
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # Handle Next.js streaming
        proxy_buffering off;
        proxy_cache off;
    }
}
```

### Step 5: Update docker-compose.yml (Development)

**Changes:**
- Add nginx service
- Remove direct port exposures for frontend/backend (or keep for dev convenience)
- Add nginx to app-network

```yaml
services:
  # ... existing services ...

  # ====================
  # Nginx Reverse Proxy
  # ====================
  nginx:
    image: nginx:1.25-alpine
    container_name: nginx-dev
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - backend
      - frontend
    networks:
      - app-network

networks:
  app-network:
    name: app-network
```

### Step 6: Update docker-compose.prod.yml (Production)

**Changes:**
- Add nginx service with production optimizations
- Add SSL preparation (certbot, etc. for future)
- Remove direct port exposures

```yaml
services:
  # ... existing services ...

  # ====================
  # Nginx Reverse Proxy (Production)
  # ====================
  nginx:
    build:
      context: .
      dockerfile: nginx/Dockerfile
    container_name: nginx-prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ssl_data:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    networks:
      - app-network

volumes:
  # ... existing volumes ...
  ssl_data:
```

### Step 7: Update Backend Environment (Optional)

**For production, update `.env`:**

```
# Change from localhost:5000 to relative path
NEXT_PUBLIC_BASE_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com
```

### Step 8: Verify and Test

1. Rebuild containers: `docker-compose up -d --build`
2. Check nginx logs: `docker logs nginx-dev`
3. Test endpoints:
   - `curl http://localhost/` → Frontend
   - `curl http://localhost/api/health` → Backend
   - `curl http://localhost/health` → Nginx health check
4. Check WebSocket: Connect to Socket.IO via nginx

---

## 🔧 Environment-Specific Notes

### Development Mode
- Keep direct ports (3000, 5000) for hot reload debugging
- Use nginx for testing production-like behavior locally
- Add entry to `/etc/hosts` if testing with custom domain

### Production Mode (Future Enhancement)
- Add SSL with Let's Encrypt/Certbot
- Configure proper domain
- Add monitoring (Prometheus, Grafana)
- Add log rotation
- Configure CDN for static assets

---

## ⚠️ Pre-Implementation Checklist

Before proceeding, confirm:

- [ ] Current services (backend, frontend) are running correctly
- [ ] You understand the port change (3000 → nginx 80)
- [ ] WebSocket functionality is critical for your chat feature
- [ ] You have tested locally with current setup first
- [ ] Database migrations are applied (if any)

---

## 📂 Files to Create/Modify Summary

| File | Action | Description |
|------|--------|-------------|
| `nginx/Dockerfile` | Create | Nginx container build |
| `nginx/nginx.conf` | Create | Main nginx config |
| `nginx/conf.d/default.conf` | Create | Site routing config |
| `docker-compose.yml` | Modify | Add nginx service (dev) |
| `docker-compose.prod.yml` | Modify | Add nginx service (prod) |

---

## ❓ Questions for Your Review

1. **Ports**: Should I remove direct port access (3000, 5000) after nginx is working?
2. **SSL**: Do you want to set up SSL now, or keep it for a separate task?
3. **WebSocket**: Are you using Socket.IO? The config includes WebSocket proxying.
4. **Custom Domain**: Will you use a custom domain, or localhost for now?
5. **Monitoring**: Add basic nginx log monitoring in this plan?

---

*Plan generated: DevOps Logic Scan + Implementation Steps*
*Ready for your review before execution.*