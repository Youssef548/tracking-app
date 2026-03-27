# Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy The Mindful Flow to `https://yfawzy.dev/projects/mindful-flow` using Docker + Traefik + GHCR + GitHub Actions, mirroring the airbnb-clone deployment.

**Architecture:** Three Docker containers (nginx client, Node.js server, MongoDB) on a VPS behind Traefik v3 reverse proxy. Client nginx handles SPA serving and API proxying. GitHub Actions builds images to GHCR and deploys via SSH.

**Tech Stack:** Docker, nginx, Traefik v3, GitHub Actions, GHCR, pnpm, node:20-alpine, mongo:7

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `packages/server/Dockerfile` | Multi-stage: install deps → copy source → run Node.js server |
| Create | `packages/client/Dockerfile.prod` | Multi-stage: install deps + Vite build → nginx serve |
| Create | `packages/client/nginx.conf` | SPA fallback + `/api/` proxy to server container |
| Create | `docker-compose.prod.yml` | Production orchestration (3 services + Traefik labels) |
| Create | `.github/workflows/deploy.yml` | CI/CD: build images, push GHCR, SSH deploy |
| Create | `.env.production.example` | Template for VPS environment variables |
| Create | `.dockerignore` | Exclude node_modules/dist/.git from Docker build context |
| Modify | `packages/client/vite.config.js` | Add `base: "/projects/mindful-flow/"` for subpath asset URLs |
| Modify | `packages/client/src/main.jsx` | Add `basename="/projects/mindful-flow"` to BrowserRouter |
| Modify | `packages/client/src/services/api.js` | Use `VITE_API_BASE` env var for baseURL |

---

### Task 1: Create `.dockerignore`

**Files:**
- Create: `.dockerignore`

Prevents sending `node_modules`, `dist`, `.git`, and other junk into the Docker build context — dramatically speeds up builds.

- [ ] **Step 1: Create the file**

```
node_modules
dist
.git
.gitignore
*.log
.turbo
.env
packages/e2e
.superpowers
docs
```

- [ ] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "chore: add .dockerignore to speed up Docker builds"
```

---

### Task 2: Create `.env.production.example`

**Files:**
- Create: `.env.production.example`

Template committed to git. Real `.env` is placed manually on VPS.

- [ ] **Step 1: Create the file**

```
MONGO_USER=mindful_admin
MONGO_PASS=CHANGE_ME_STRONG_PASSWORD
JWT_SECRET=CHANGE_ME_RANDOM_SECRET
SERVER_IMAGE=ghcr.io/youssef548/mindful-flow-server:latest
CLIENT_IMAGE=ghcr.io/youssef548/mindful-flow-client:latest
```

- [ ] **Step 2: Commit**

```bash
git add .env.production.example
git commit -m "chore: add production env template"
```

---

### Task 3: Create server Dockerfile

**Files:**
- Create: `packages/server/Dockerfile`

Multi-stage production Dockerfile. This project uses plain JavaScript (no TypeScript), so `node` runs the server directly — no `tsx` needed. The build context is the repo root (`.`) because the server depends on the `shared` workspace package.

- [ ] **Step 1: Create the Dockerfile**

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for workspace resolution
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

RUN pnpm install --frozen-lockfile --prod

# Stage 2: Production image
FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules

# Copy workspace root files
COPY package.json pnpm-workspace.yaml ./

# Copy source code for server and its dependency (shared)
COPY packages/shared/ ./packages/shared/
COPY packages/server/ ./packages/server/

USER nodejs
WORKDIR /app/packages/server

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:5000/api/health || exit 1
CMD ["node", "src/index.js"]
```

- [ ] **Step 2: Verify the Dockerfile builds locally**

Run from the repo root:

```bash
docker build -f packages/server/Dockerfile -t mindful-flow-server:test .
```

Expected: successful build, image tagged `mindful-flow-server:test`.

- [ ] **Step 3: Smoke-test the image**

```bash
docker run --rm -e JWT_SECRET=test-secret -e MONGO_URI=mongodb://host.docker.internal:27017/test -e PORT=5000 -p 5000:5000 mindful-flow-server:test
```

Expected: server starts (may fail on MongoDB connection if no local MongoDB, but `node src/index.js` should execute without module errors). Check that the process starts and the health check endpoint responds if MongoDB is available. Press Ctrl+C to stop.

- [ ] **Step 4: Commit**

```bash
git add packages/server/Dockerfile
git commit -m "feat(deploy): add server production Dockerfile"
```

---

### Task 4: Create client nginx config

**Files:**
- Create: `packages/client/nginx.conf`

Nginx serves the Vite-built SPA and proxies `/api/` requests to the server container by Docker service name. Traefik strips the `/projects/mindful-flow` prefix before forwarding to this nginx, so nginx serves everything from root `/`.

- [ ] **Step 1: Create the nginx config**

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

- [ ] **Step 2: Commit**

```bash
git add packages/client/nginx.conf
git commit -m "feat(deploy): add nginx config for SPA serving and API proxy"
```

---

### Task 5: Modify client code for subpath deployment

**Files:**
- Modify: `packages/client/vite.config.js`
- Modify: `packages/client/src/main.jsx`
- Modify: `packages/client/src/services/api.js`

Three changes needed for the app to work at `/projects/mindful-flow`:

1. **Vite `base`** — tells Vite to generate asset URLs with the subpath prefix
2. **BrowserRouter `basename`** — tells React Router the app lives at a subpath
3. **Axios `baseURL`** — uses env var so API calls go through the correct path in production

All three use the same env var `VITE_API_BASE` / `BASE_URL` pattern so local dev (`localhost:3000`) is unaffected.

- [ ] **Step 1: Add `base` to vite.config.js**

In `packages/client/vite.config.js`, the current `defineConfig` object has `plugins`, `resolve`, and `server`. Add `base` at the top level:

```js
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  // ... rest unchanged
});
```

This defaults to `/` in local dev. The Docker build will set `VITE_BASE_PATH=/projects/mindful-flow/`.

- [ ] **Step 2: Add `basename` to BrowserRouter in main.jsx**

In `packages/client/src/main.jsx`, the `<BrowserRouter>` currently has no props. Change it to:

```jsx
<BrowserRouter basename={import.meta.env.BASE_URL}>
```

Vite sets `import.meta.env.BASE_URL` to the value of the `base` config. In local dev this is `/`, in production it's `/projects/mindful-flow/`. This makes React Router aware of the subpath for route matching and `<Link>` components.

- [ ] **Step 3: Update Axios baseURL in api.js**

In `packages/client/src/services/api.js`, change line 4 from:

```js
  baseURL: '/api',
```

to:

```js
  baseURL: import.meta.env.VITE_API_BASE || '/api',
```

In local dev, `VITE_API_BASE` is undefined so it falls back to `/api` (proxied by Vite dev server). In production Docker build, `VITE_API_BASE=/projects/mindful-flow/api` is injected as a build arg, making API calls go through the Traefik-routed path.

- [ ] **Step 4: Fix the 401 redirect to be subpath-aware**

In `packages/client/src/services/api.js`, the 401 interceptor (line 20) currently does:

```js
window.location.href = '/login';
```

This would navigate to `yfawzy.dev/login` which doesn't exist. Change to:

```js
window.location.href = import.meta.env.BASE_URL + 'login';
```

`BASE_URL` is `/` locally (making it `/login`) and `/projects/mindful-flow/` in production (making it `/projects/mindful-flow/login`).

- [ ] **Step 5: Verify local dev still works**

```bash
cd packages/client && pnpm dev
```

Expected: Vite starts at `localhost:3000`, app loads at `/`, API calls go to `/api` (proxied to server). Nothing should change in local dev behavior.

- [ ] **Step 6: Commit**

```bash
git add packages/client/vite.config.js packages/client/src/main.jsx packages/client/src/services/api.js
git commit -m "feat(deploy): configure client for subpath deployment at /projects/mindful-flow"
```

---

### Task 6: Create client production Dockerfile

**Files:**
- Create: `packages/client/Dockerfile.prod`

Multi-stage: Stage 1 builds the Vite app with pnpm. Stage 2 serves the build output with nginx. Build args inject the subpath and API base URL at build time.

- [ ] **Step 1: Create the Dockerfile**

```dockerfile
# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for workspace resolution
COPY packages/shared/package.json ./packages/shared/
COPY packages/client/package.json ./packages/client/

RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/client/ ./packages/client/

# Build args for Vite
ARG VITE_API_BASE
ARG VITE_BASE_PATH
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_BASE_PATH=$VITE_BASE_PATH

# Build client (from workspace root so pnpm workspace resolution works)
RUN pnpm --filter @mindful-flow/client build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 2: Verify the Dockerfile builds locally**

Run from the repo root:

```bash
docker build -f packages/client/Dockerfile.prod --build-arg VITE_API_BASE=/projects/mindful-flow/api --build-arg VITE_BASE_PATH=/projects/mindful-flow/ -t mindful-flow-client:test .
```

Expected: successful build. The Vite output should show the built assets.

- [ ] **Step 3: Commit**

```bash
git add packages/client/Dockerfile.prod
git commit -m "feat(deploy): add client production Dockerfile with nginx"
```

---

### Task 7: Create docker-compose.prod.yml

**Files:**
- Create: `docker-compose.prod.yml`

Defines three services: MongoDB (internal only), server (internal only), client (on both internal and gateway networks, with Traefik labels). Environment variables are read from `.env` file on the VPS.

- [ ] **Step 1: Create the file**

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

- [ ] **Step 2: Validate compose syntax**

```bash
docker compose -f docker-compose.prod.yml config
```

Expected: parsed YAML output with no errors (may warn about missing `.env` vars — that's fine, those exist only on the VPS).

- [ ] **Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat(deploy): add production docker-compose with Traefik labels"
```

---

### Task 8: Create GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

Three jobs: build-server and build-client run in parallel, then deploy SSHes into the VPS to pull and restart.

**Required GitHub secrets** (reuse the same SSH key as airbnb-clone):
- `SSH_PRIVATE_KEY` — Ed25519 key for `deploy` user
- `SERVER_HOST` — VPS IP
- `SERVER_USER` — `deploy`

The workflow uses `secrets.GITHUB_TOKEN` (automatic) for GHCR auth — no separate GHCR_TOKEN secret is needed because `permissions: packages: write` grants push access.

- [ ] **Step 1: Create the workflow directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create the workflow file**

```yaml
name: Build & Deploy

on:
  push:
    branches: [master]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  DEPLOY_PATH: /opt/mindful-flow

jobs:
  build-server:
    name: Build Server Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/setup-buildx-action@v3

      - name: Generate image tag
        id: tag
        run: |
          echo "sha=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
          echo "owner=$(echo '${{ github.repository_owner }}' | tr '[:upper:]' '[:lower:]')" >> $GITHUB_OUTPUT

      - uses: docker/build-push-action@v6
        with:
          context: .
          file: ./packages/server/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ steps.tag.outputs.owner }}/mindful-flow-server:${{ steps.tag.outputs.sha }}
            ghcr.io/${{ steps.tag.outputs.owner }}/mindful-flow-server:latest
          cache-from: type=gha,scope=server
          cache-to: type=gha,mode=max,scope=server

  build-client:
    name: Build Client Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/setup-buildx-action@v3

      - name: Generate image tag
        id: tag
        run: |
          echo "sha=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
          echo "owner=$(echo '${{ github.repository_owner }}' | tr '[:upper:]' '[:lower:]')" >> $GITHUB_OUTPUT

      - uses: docker/build-push-action@v6
        with:
          context: .
          file: ./packages/client/Dockerfile.prod
          push: true
          tags: |
            ghcr.io/${{ steps.tag.outputs.owner }}/mindful-flow-client:${{ steps.tag.outputs.sha }}
            ghcr.io/${{ steps.tag.outputs.owner }}/mindful-flow-client:latest
          build-args: |
            VITE_API_BASE=/projects/mindful-flow/api
            VITE_BASE_PATH=/projects/mindful-flow/
          cache-from: type=gha,scope=client
          cache-to: type=gha,mode=max,scope=client

  deploy:
    name: Deploy to Server
    needs: [build-server, build-client]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            set -e
            cd ${{ env.DEPLOY_PATH }}

            # Pull latest compose config
            git fetch origin master
            git reset --hard origin/master

            # Login to GHCR
            echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin || true

            # Pull latest images
            OWNER=$(echo "${{ github.repository_owner }}" | tr '[:upper:]' '[:lower:]')
            docker pull ghcr.io/${OWNER}/mindful-flow-server:latest
            docker pull ghcr.io/${OWNER}/mindful-flow-client:latest

            # Restart services
            docker compose -f docker-compose.prod.yml up -d

            # Verify containers are running
            sleep 5
            docker compose -f docker-compose.prod.yml ps

            # Health check
            echo "Checking server health..."
            for i in 1 2 3 4 5; do
              if docker exec mindful-flow-server wget -qO- http://localhost:5000/api/health > /dev/null 2>&1; then
                echo "Server is healthy!"
                break
              fi
              echo "Attempt $i: waiting..."
              sleep 5
            done

            # Cleanup old images
            docker image prune -f --filter "until=168h"
```

- [ ] **Step 3: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" 2>/dev/null || echo "Install PyYAML or just visually verify"
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat(deploy): add GitHub Actions CI/CD workflow for VPS deployment"
```

---

### Task 9: Final local build verification

No new files. This task verifies everything works end-to-end locally before pushing.

- [ ] **Step 1: Build server image**

```bash
docker build -f packages/server/Dockerfile -t mindful-flow-server:test .
```

Expected: builds successfully.

- [ ] **Step 2: Build client image**

```bash
docker build -f packages/client/Dockerfile.prod --build-arg VITE_API_BASE=/projects/mindful-flow/api --build-arg VITE_BASE_PATH=/projects/mindful-flow/ -t mindful-flow-client:test .
```

Expected: builds successfully. Vite output shows `base: /projects/mindful-flow/`.

- [ ] **Step 3: Verify local dev is not broken**

```bash
cd packages/client && pnpm dev
```

Expected: app loads at `localhost:3000/`, router works, API calls go to `/api`.

- [ ] **Step 4: Clean up test images**

```bash
docker rmi mindful-flow-server:test mindful-flow-client:test 2>/dev/null || true
```

- [ ] **Step 5: Final commit with all changes**

If any uncommitted changes remain:

```bash
git status
# Stage and commit any remaining files
```

---

### Task 10: VPS setup (manual, one-time)

These steps are performed on the VPS via SSH — NOT automated. They only need to run once.

- [ ] **Step 1: Create deploy key for the repo**

SSH into the VPS as the `deploy` user:

```bash
ssh deploy@46.225.219.72
```

Run the server-gateway script (adjust repo name to match your GitHub repo):

```bash
cd /opt/server-gateway
./scripts/add-repo.sh YourGitHubUser/tracking-app /opt/mindful-flow
```

This generates an Ed25519 deploy key, prints the public key, and clones the repo to `/opt/mindful-flow`.

- [ ] **Step 2: Add the deploy key to GitHub**

Go to `https://github.com/YourUser/tracking-app/settings/keys` → Add deploy key → paste the public key printed by the script. Check "Allow write access" is NOT needed (read-only is fine).

- [ ] **Step 3: Create the `.env` file on the VPS**

```bash
cat > /opt/mindful-flow/.env << 'EOF'
MONGO_USER=mindful_admin
MONGO_PASS=<generate-a-strong-password>
JWT_SECRET=<generate-a-random-secret>
SERVER_IMAGE=ghcr.io/youssef548/mindful-flow-server:latest
CLIENT_IMAGE=ghcr.io/youssef548/mindful-flow-client:latest
EOF
chmod 600 /opt/mindful-flow/.env
```

Generate strong passwords with: `openssl rand -base64 32`

- [ ] **Step 4: Ensure GitHub secrets are configured**

In the GitHub repo → Settings → Secrets and variables → Actions, verify these secrets exist (they may already be configured from the airbnb-clone):

- `SSH_PRIVATE_KEY` — Ed25519 private key for the `deploy` user
- `SERVER_HOST` — `46.225.219.72`
- `SERVER_USER` — `deploy`

- [ ] **Step 5: Push to master to trigger first deployment**

```bash
git push origin master
```

Monitor the GitHub Actions tab for the build and deploy jobs. After deploy completes, verify at `https://yfawzy.dev/projects/mindful-flow`.
