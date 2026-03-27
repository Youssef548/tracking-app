# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for workspace resolution
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Use hoisted node-linker to avoid broken symlinks in Docker
# (pnpm lockfile from Windows contains Windows paths in symlinks)
RUN echo "node-linker=hoisted" > .npmrc && pnpm install --no-frozen-lockfile

# Stage 2: Production image
FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

# Copy hoisted node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy workspace root files
COPY package.json pnpm-workspace.yaml ./

# Copy source code for server and its dependency (shared)
COPY packages/shared/ ./packages/shared/
COPY packages/server/ ./packages/server/

# Fix workspace symlink for @mindful-flow/shared
RUN mkdir -p /app/node_modules/@mindful-flow && \
    rm -rf /app/node_modules/@mindful-flow/shared && \
    ln -s /app/packages/shared /app/node_modules/@mindful-flow/shared

USER nodejs
WORKDIR /app/packages/server

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:5000/api/health || exit 1
CMD ["node", "src/index.js"]
