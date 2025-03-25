FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies (only when needed)
RUN apk add --no-cache python3 make g++ && \
    # Create credentials directory
    mkdir -p config/credentials

# Copy package files first to leverage Docker cache
COPY package*.json tsconfig.json paths.js ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Add minimal required packages only
RUN apk add --no-cache tini && \
    addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodeuser

WORKDIR /app

# Copy package files
COPY package*.json paths.js ./

# Install production dependencies only
RUN npm install --only=production --silent

# Copy build output from builder stage
COPY --from=builder --chown=nodeuser:nodejs /app/build ./build 

# Set up required directories with proper permissions
RUN mkdir -p build/config/credentials logs && \
    chown -R nodeuser:nodejs build logs && \
    chmod 755 logs

# Set environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    # Reduce memory usage for t2.micro (1GB RAM)
    NODE_OPTIONS="--max-old-space-size=768" \
    TZ=UTC

USER nodeuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -q --spider http://localhost:3001/api/v1/apiHealth || exit 1

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "build/server.js"]