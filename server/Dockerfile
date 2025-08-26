### BASE STAGE
FROM node:22-alpine3.20 AS base

# Install dumb-init in base stage
RUN apk add --no-cache dumb-init=1.2.5-r3

WORKDIR /app

# ===== Dependencies stage =====
FROM base AS deps

# Copy only package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# ===== Dev dependencies stage =====
FROM deps AS dev-deps

# Install all dependencies
RUN npm ci && \
    npm cache clean --force

# ===== Build stage =====
FROM dev-deps AS builder

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ===== Production stage =====
FROM base AS production

# Create app directory
RUN mkdir -p /app/logs && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Copy production dependencies from deps stage
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/package.json ./

# Expose port
EXPOSE 3000

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "build/src/main/index.js"]
