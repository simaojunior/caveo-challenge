## ===== Base STAGE =====
FROM node:22.11-alpine3.20 AS base

# Install dumb-init once in base (smaller layer)
RUN apk add --no-cache dumb-init=1.2.5-r3

WORKDIR /app

# ===== DEPENDENCIES STAGE =====
FROM base AS deps

# Copy only package files for better caching
COPY package*.json ./

# Use ci for faster, more reliable installs in CI/CD
RUN npm ci --only=production && \
    npm cache clean --force

# ===== DEV DEPENDENCIES STAGE =====
FROM deps AS dev-deps

# Install all dependencies including dev
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

# Create non-root user (reuse node user that already exists)
RUN chown -R node:node /app

# Copy production dependencies
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/package.json ./

# Switch to non-root user
USER node

# Expose port (documentation only)
EXPOSE 3000

# Simple health check using wget (already in alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Simplified start command
CMD ["node", "build/src/main/index.js"]
