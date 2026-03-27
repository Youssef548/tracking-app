# Deployment Design: The Mindful Flow

**Date**: 2026-03-27
**Status**: Approved
**Live URL**: `https://yfawzy.dev/projects/mindful-flow`

## Overview

Deploy The Mindful Flow to the existing VPS (46.225.219.72) using the same Docker + Traefik + GHCR + GitHub Actions pattern as the airbnb-clone project. The app will be served at `/projects/mindful-flow` behind the existing Traefik reverse proxy with automatic Let's Encrypt TLS.

## Architecture

```
Internet → Traefik v3 (yfawzy.dev, Let's Encrypt, already running)
           Rule: Host(`yfawzy.dev`) && PathPrefix(`/projects/mindful-flow`)
           Middleware: strip /projects/mindful-flow prefix → forward to client:80

  [Docker network: mindful-flow-internal]
  ┌──────────────────────────────────────────────┐
  │                                              │
  │  mindful-flow-client (nginx:alpine, port 80) │
  │    /api/  → proxy_pass http://server:5000    │
  │    /      → try_files → /index.html (SPA)    │
  │    On BOTH: internal + gateway networks      │
  │                                              │
  │  mindful-flow-server (node:20-alpine, :5000) │
  │    Runs: node src/index.js                   │
  │    Internal network only                     │
  │                                              │
  │  mindful-flow-mongodb (mongo:7, internal)    │
  │    Volume: mindful-flow-mongodb-data         │
  │    Internal network only                     │
  │                                              │
  └──────────────────────────────────────────────┘
```

Only the client nginx container is on the `gateway` network (visible to Traefik). The server and MongoDB are on the `internal` network only — never exposed externally. All API traffic flows: Traefik → nginx → server.

## Files to Create

### 1. `packages/server/Dockerfile`

Multi-stage production Dockerfile:

**Stage 1 (deps)**: `node:20-alpine`
- Enable corepack + pnpm
- Copy root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- Copy `packages/shared/package.json` and `packages/server/package.json`
- Run `pnpm install --frozen-lockfile`

**Stage 2 (production)**: `node:20-alpine`
- Create non-root `nodejs` user (uid 1001)
- Copy `node_modules` from deps stage
- Copy source: `packages/shared/` and `packages/server/`
- Expose 5000
- Healthcheck: `wget -qO- http://localhost:5000/api/health`
- CMD: `node packages/server/src/index.js`
- Build context: repo root (`.`)

Key difference from airbnb: no `tsx` needed — this server is plain JavaScript.

### 2. `packages/client/Dockerfile.prod`

Multi-stage production Dockerfile:

**Stage 1 (builder)**: `node:20-alpine`
- Enable corepack + pnpm
- Copy root workspace files + `packages/shared/` + `packages/client/`
- Install deps
- Accept build args: `VITE_API_BASE`
- Run `pnpm --filter @mindful-flow/client build`

**Stage 2 (serve)**: `nginx:alpine`
- Copy `packages/client/dist/` to `/usr/share/nginx/html`
- Copy `packages/client/nginx.conf` to `/etc/nginx/conf.d/default.conf`
- Expose 80

Build context: repo root (`.`)

### 3. `packages/client/nginx.conf`

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;

    location /api/ {
        proxy_pass http://server:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 5m;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
}
```

Traefik strips `/projects/mindful-flow` before forwarding to nginx, so nginx serves from root `/`.

### 4. `docker-compose.prod.yml`

```yaml
services:
  mongodb:
    image: mongo:7
    container_name: mindful-flow-mongodb
    networks: [internal]
    volumes: [mongodb_data:/data/db]
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASS}
    restart: unless-stopped

  server:
    image: ${SERVER_IMAGE:-ghcr.io/youssef548/mindful-flow-server:latest}
    container_name: mindful-flow-server
    depends_on: [mongodb]
    environment:
      MONGO_URI: mongodb://${MONGO_USER}:${MONGO_PASS}@mongodb:27017/mindful-flow?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      PORT: 5000
      CORS_ORIGIN: https://yfawzy.dev
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks: [internal]
    restart: unless-stopped

  client:
    image: ${CLIENT_IMAGE:-ghcr.io/youssef548/mindful-flow-client:latest}
    container_name: mindful-flow-client
    depends_on: [server]
    networks: [internal, gateway]
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mindful-flow.rule=Host(`yfawzy.dev`) && PathPrefix(`/projects/mindful-flow`)"
      - "traefik.http.routers.mindful-flow.entrypoints=websecure"
      - "traefik.http.routers.mindful-flow.tls.certresolver=letsencrypt"
      - "traefik.http.routers.mindful-flow.middlewares=mindful-flow-strip@docker,secure-default@file"
      - "traefik.http.middlewares.mindful-flow-strip.stripprefix.prefixes=/projects/mindful-flow"
      - "traefik.http.services.mindful-flow.loadbalancer.server.port=80"
      - "traefik.docker.network=gateway"
    restart: unless-stopped

networks:
  internal: {}
  gateway:
    external: true

volumes:
  mongodb_data: {}
```

### 5. `.github/workflows/deploy.yml`

**Trigger**: push to `master`

**Three jobs**:

1. **build-server** (parallel):
   - Checkout, login to GHCR
   - Build `packages/server/Dockerfile` with context `.`
   - Push `ghcr.io/youssef548/mindful-flow-server:{sha}` + `:latest`
   - Docker layer cache (GitHub Actions cache, scope=server)

2. **build-client** (parallel):
   - Checkout, login to GHCR
   - Build `packages/client/Dockerfile.prod` with context `.`
   - Build arg: `VITE_API_BASE=/projects/mindful-flow/api`
   - Push `ghcr.io/youssef548/mindful-flow-client:{sha}` + `:latest`
   - Docker layer cache (scope=client)

3. **deploy** (needs both builds, environment: production):
   - SSH into VPS as `deploy` user
   - `cd /opt/mindful-flow`
   - `git fetch origin master && git reset --hard origin/master`
   - Login to GHCR, pull both `:latest` images
   - `docker compose -f docker-compose.prod.yml up -d`
   - Health check loop (5 attempts, 5s apart): `docker exec mindful-flow-server wget -qO- http://localhost:5000/api/health`
   - `docker image prune -f --filter "until=168h"`

**Required GitHub secrets** (same SSH key as airbnb):
- `SSH_PRIVATE_KEY` — Ed25519 key for `deploy` user
- `SERVER_HOST` — VPS IP
- `SERVER_USER` — `deploy`
- `GHCR_TOKEN` — GitHub token with `packages:write`

### 6. `.env.production.example`

```
MONGO_USER=mindful_admin
MONGO_PASS=CHANGE_ME_STRONG_PASSWORD
JWT_SECRET=CHANGE_ME_RANDOM_SECRET
SERVER_IMAGE=ghcr.io/youssef548/mindful-flow-server:latest
CLIENT_IMAGE=ghcr.io/youssef548/mindful-flow-client:latest
```

This file is committed as a template. The actual `.env` is placed manually on the VPS at `/opt/mindful-flow/.env`.

## Existing Code Changes

### `packages/client/vite.config.js`

Add `base: "/projects/mindful-flow/"` so Vite generates correct asset URLs for the subpath deployment.

**Important**: This only affects the production build. In dev mode, Vite ignores `base` when using the dev server, so local development at `localhost:5173` continues to work unchanged.

### Client API baseURL

The current Axios `baseURL: '/api'` needs no change. Here's why:

1. Browser requests `/api/habits` → `yfawzy.dev/api/habits`
2. This does NOT match Traefik's `/projects/mindful-flow` prefix rule
3. BUT: Vite's `base: "/projects/mindful-flow/"` makes the browser fetch assets from `yfawzy.dev/projects/mindful-flow/assets/...`
4. The SPA JavaScript runs in the browser and makes API calls to `/api/...` relative to the origin
5. These `/api/...` requests hit `yfawzy.dev/api/...` which Traefik does NOT route

**This means we need to change the Axios baseURL** to use a path that Traefik will route through the client container. Set `baseURL` to `/projects/mindful-flow/api` so the request path becomes `yfawzy.dev/projects/mindful-flow/api/habits` → Traefik strips prefix → nginx sees `/api/habits` → proxies to server.

To avoid breaking local dev, use an environment variable:
- `services/api.js`: `baseURL: import.meta.env.VITE_API_BASE || '/api'`
- Docker build arg: `VITE_API_BASE=/projects/mindful-flow/api`
- Local dev uses the default `/api` (proxied by Vite)

## VPS Setup (One-Time)

1. Run `server-gateway/scripts/add-repo.sh` to create a deploy key for this repo
2. Clone repo to `/opt/mindful-flow`
3. Create `/opt/mindful-flow/.env` from `.env.production.example` with real values
4. First push to `master` triggers the CI/CD pipeline

## What Is NOT Needed (vs Airbnb)

- No OAuth secrets (no Google/GitHub login)
- No uploads volume (no file uploads)
- No database seeding step
- No `tsx` runtime (plain JS server)
- No Cloudinary integration
