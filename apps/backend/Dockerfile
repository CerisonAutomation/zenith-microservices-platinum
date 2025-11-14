# Multi-stage build for optimized Node.js backend
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.0.0 --activate

COPY package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages

RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.0.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY . .

RUN pnpm turbo build --filter=backend

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

COPY --from=builder --chown=backend:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=backend:nodejs /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder --chown=backend:nodejs /app/apps/backend/package.json ./apps/backend/

USER backend

EXPOSE 4000

ENV PORT=4000
ENV HOST="0.0.0.0"

CMD ["node", "apps/backend/dist/index.js"]
