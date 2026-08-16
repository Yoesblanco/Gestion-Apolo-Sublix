# ==========================================
# Etapa 1: Dependencias Completas & Build
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para compilar
COPY package*.json tsconfig.json ./
RUN npm ci --no-audit --no-fund

# Copiar código fuente y compilar
COPY src ./src
COPY drizzle.config.ts ./
RUN npm run build

# ==========================================
# Etapa 2: Dependencias de Producción Limpias
# ==========================================
FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# ==========================================
# Etapa 3: Imagen Final Ultra Liviana
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar artefactos compilados y módulos productivos
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node package*.json ./

USER node

EXPOSE 5000

# Parámetro Node para optimizar recolección de basura y consumo de memoria RAM
CMD ["node", "--max-old-space-size=256", "dist/index.js"]
