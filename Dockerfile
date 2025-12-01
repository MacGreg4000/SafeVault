# Dockerfile pour SafeGuard
FROM node:20-alpine AS base

# Installer les dépendances nécessaires pour Prisma
RUN apk add --no-cache libc6-compat openssl

# Étape 1: Dépendances
FROM base AS deps
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Générer le client Prisma
RUN npx prisma generate

# Étape 2: Builder
FROM base AS builder
WORKDIR /app

# Copier les dépendances depuis l'étape précédente
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copier le code source
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
# DATABASE_URL temporaire pour le build (sera remplacé au runtime)
ENV DATABASE_URL="file:./prisma/safeguard.db"

# Créer une base de données temporaire pour le build si elle n'existe pas
RUN touch prisma/safeguard.db || true

# Build de l'application
RUN npm run build

# Étape 3: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Créer le dossier public vide (Next.js peut fonctionner sans)
RUN mkdir -p /app/public

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copier public seulement s'il existe (optionnel, avec gestion d'erreur)
RUN --mount=from=builder,source=/app/public,target=/tmp/public \
    if [ -d "/tmp/public" ] && [ "$(ls -A /tmp/public 2>/dev/null)" ]; then \
        cp -r /tmp/public/* /app/public/ 2>/dev/null || true; \
    fi || true

# Créer le dossier pour la base de données
RUN mkdir -p /app/prisma && chown -R nextjs:nodejs /app/prisma

USER nextjs

EXPOSE 3003

ENV PORT 3003
ENV HOSTNAME "0.0.0.0"

# Commande de démarrage
CMD ["node", "server.js"]
