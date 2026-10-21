# ── Stage 1: Build ─────────────────────────────────────────────────
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.json tsconfig.build.json nest-cli.json prisma.config.ts ./
COPY prisma ./prisma

# Install dependencies, generate Prisma client, and clean cache to minimize inodes
RUN npm ci --ignore-scripts --prefer-offline \
    && npm cache clean --force \
    && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

COPY src ./src
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────
FROM node:24-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --chown=appuser:appgroup package.json package-lock.json prisma.config.ts ./
COPY --chown=appuser:appgroup prisma ./prisma

# Copy node_modules and built dist from build stage (avoids second npm ci and inode exhaustion)
COPY --chown=appuser:appgroup --from=build /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=build /app/dist ./dist

# Copy entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER appuser

ENV NODE_ENV=production
ENV PORT=8005

EXPOSE 8005

ENTRYPOINT ["dumb-init", "--"]
CMD ["docker-entrypoint.sh"]
