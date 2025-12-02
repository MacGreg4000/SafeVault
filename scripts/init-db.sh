#!/bin/sh
# Script d'initialisation qui s'exécute en root pour créer la base de données avec les bonnes permissions

echo "🔧 Initialisation des permissions de la base de données..."

# S'assurer que le dossier prisma existe et a les bonnes permissions
if [ ! -d "/app/prisma" ]; then
  echo "📁 Création du dossier prisma..."
  mkdir -p /app/prisma
fi

# Donner les permissions d'écriture au dossier prisma pour nextjs
chown -R nextjs:nodejs /app/prisma 2>/dev/null || true
chmod 775 /app/prisma 2>/dev/null || true

# Créer ou vérifier le fichier de base de données
if [ ! -f "/app/prisma/safeguard.db" ]; then
  echo "📦 Création de la base de données avec les bonnes permissions..."
  touch /app/prisma/safeguard.db
  chown nextjs:nodejs /app/prisma/safeguard.db
  chmod 664 /app/prisma/safeguard.db
  echo "✅ Base de données créée"
else
  echo "✅ Base de données existe déjà"
  # S'assurer que les permissions sont correctes
  chown nextjs:nodejs /app/prisma/safeguard.db 2>/dev/null || true
  chmod 664 /app/prisma/safeguard.db 2>/dev/null || true
fi

echo "✅ Permissions configurées"

