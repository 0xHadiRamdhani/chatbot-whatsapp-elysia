# Multi-stage Docker build for WhatsApp Bot

# Stage 1: Build stage
FROM oven/bun:1.1.24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY tsconfig.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src ./src

# Build the application
RUN bun build src/index.ts --outdir=dist --target=bun

# Stage 2: Production stage
FROM oven/bun:1.1.24-alpine AS production

# Install system dependencies for WhatsApp Web
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S whatsapp-bot -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install production dependencies only
RUN bun install --production --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy configuration files
COPY .env.example ./

# Create necessary directories
RUN mkdir -p data logs sessions plugins && \
    chown -R whatsapp-bot:nodejs /app

# Switch to non-root user
USER whatsapp-bot

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bun -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Set entrypoint
ENTRYPOINT ["bun", "run", "dist/index.js"]

# Stage 3: Development stage
FROM oven/bun:1.1.24-alpine AS development

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    git \
    && rm -rf /var/cache/apk/*

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy all files for development
COPY . .

# Install all dependencies (including dev dependencies)
RUN bun install

# Expose port
EXPOSE 3000

# Development command
CMD ["bun", "run", "dev"]