# Build de produção para VPS (Node 20 + Next.js + Prisma)
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholders só para `prisma generate` (não conecta ao DB). Runtime usa .env / secrets reais.
ENV DATABASE_URL="postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder"
ENV DIRECT_URL="postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder"
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["npm", "start"]
