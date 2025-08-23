# ===== Base STAGE =====
FROM node:22-alpine AS base

RUN apk update && apk upgrade && \
    apk add --no-cache libc6-compat dumb-init

RUN npm install -g pnpm@10.14.0

WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S caveo -u 1001

# ===== DEPENDENCIES STAGE =====
FROM base AS deps

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ===== BUILD STAGE =====
FROM base AS builder

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN pnpm build && \
    pnpm prune --production

# ===== PRODUCTION STAGE =====
FROM node:22-alpine AS runner

# Install security updates and dumb-init
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S caveo -u 1001

# Copy only production files
COPY --from=builder --chown=caveo:nodejs /app/build ./build
COPY --from=builder --chown=caveo:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=caveo:nodejs /app/package.json ./package.json

# Switch to non-root user
USER caveo

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');http.get('http://localhost:3000/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "build/src/main/index.js"]
