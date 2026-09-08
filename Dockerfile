# ── Stage 1: Install dependencies ──────────────────────────────────
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ── Stage 2: Build ─────────────────────────────────────────────────
FROM node:24-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src

# Generate Prisma Client and build the NestJS app
# DATABASE_URL is required by prisma.config.ts but not used during generate
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate && npm run build

# ── Stage 3: Production ───────────────────────────────────────────
FROM node:24-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init

# Copy only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --omit=dev

# Copy Prisma schema + generated client + engines from build stage
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY prisma ./prisma
COPY prisma.config.ts ./

# Copy compiled output
COPY --from=build /app/dist ./dist

# Copy entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

ENTRYPOINT ["dumb-init", "--"]
CMD ["docker-entrypoint.sh"]
