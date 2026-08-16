# ===================================================
# Stage 1: Build Frontend (Vite + TypeScript)
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for maximum layer cache reuse
COPY package*.json ./
RUN npm ci

# Copy application source and build config
COPY tsconfig.json vite.config.js index.html ./
COPY src/ ./src/
COPY public/ ./public/

# Production build
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ===================================================
# Stage 2: Production Nginx Server (Ultra-lightweight)
# ===================================================
FROM nginx:alpine AS runner

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
