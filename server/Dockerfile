## ===== Base STAGE =====
FROM node:22.11-alpine3.20 AS base

# Install dumb-init
RUN apk add --no-cache dumb-init=1.2.5-r3

WORKDIR /app

# ===== DEPENDENCIES STAGE =====
FROM base AS deps

# Copy only package files
COPY package*.json ./

RUN npm ci --only=production && \
    npm cache clean --force

# ===== DEV DEPENDENCIES STAGE =====
FROM deps AS dev-deps

# Install all dependencies
RUN npm ci && \
    npm cache clean --force

# ===== BUILD STAGE =====
FROM dev-deps AS builder

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ===== PRODUCTION STAGE =====
FROM base AS runner

# Create non-root user
RUN chown -R node:node /app

# Copy production dependencies
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/package.json ./

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Simple health check using wget (already in alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "build/src/main/index.js"]
