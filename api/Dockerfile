# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl python3 make g++
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---- Build (full deps, compile) ----
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# ---- Prod deps only (smaller, no devDependencies) ----
FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile --prod

# ---- Runtime ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nestjs:nodejs /app/prisma.config.ts ./prisma.config.ts

USER nestjs
EXPOSE 5000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/src/main"]