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

# Créer le dossier public s'il n'existe pas (pour éviter les erreurs)
RUN mkdir -p public || true

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
RUN mkdir -p /app/public && chown -R nextjs:nodejs /app/public

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copier le dossier prisma avec le schéma et les migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copier le script de démarrage
COPY --chown=nextjs:nodejs scripts/start.sh ./start.sh

# Le dossier public est créé vide, pas besoin de le copier
# Si vous avez des fichiers statiques dans public/, ajoutez cette ligne :
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Créer le dossier pour la base de données
RUN mkdir -p /app/prisma && chown -R nextjs:nodejs /app/prisma

# Installer Prisma CLI dans le conteneur final (nécessaire pour les migrations)
# Doit être fait avant de changer d'utilisateur
RUN npm install -g prisma@^5.22.0

# Créer le dossier node_modules pour le client Prisma si nécessaire
RUN mkdir -p /app/node_modules && chown -R nextjs:nodejs /app/node_modules

# Rendre le script exécutable (avant de changer d'utilisateur)
RUN chmod +x /app/start.sh

USER nextjs

EXPOSE 3003

ENV PORT 3003
ENV HOSTNAME "0.0.0.0"

# Utiliser le script de démarrage
CMD ["/app/start.sh"]
