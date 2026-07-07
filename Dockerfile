# ─── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached when package.json doesn't change)
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY . .
RUN npm run build

# Prune devDependencies to keep the final image lean
RUN npm prune --omit=dev

# ─── Stage 2: Production Runtime ────────────────────────────────────────────
FROM node:20-alpine AS runner

LABEL org.opencontainers.image.title="YegnaFinder Backend API"
LABEL org.opencontainers.image.description="NestJS REST API — YegnaFinder Smart Local Discovery Platform"
LABEL org.opencontainers.image.vendor="Phoenixopia Solution PLC"

WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nestjs \
 && adduser  --system --uid 1001 nestjs

# Copy compiled output and production node_modules from builder
COPY --from=builder --chown=nestjs:nestjs /app/dist        ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./package.json

USER nestjs

# Backend listens on PORT env var (default 8000)
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-8000}/api/v1 || exit 1

CMD ["node", "dist/main"]

