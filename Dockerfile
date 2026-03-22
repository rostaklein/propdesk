# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY packages/ packages/
COPY apps/ apps/

RUN npm ci
RUN npx turbo build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/packages/ packages/
COPY --from=builder /app/apps/api/package.json apps/api/package.json
COPY --from=builder /app/apps/api/dist/ apps/api/dist/
COPY --from=builder /app/apps/web/package.json apps/web/package.json
COPY --from=builder /app/apps/web/dist/ apps/web/dist/

RUN npm ci --omit=dev

# Serve the frontend from the API
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
