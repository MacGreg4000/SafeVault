#!/bin/sh
set -e

echo "🚀 Démarrage de SafeGuard..."

# Vérifier que la base de données existe
if [ ! -f "/app/prisma/safeguard.db" ]; then
  echo "📦 Création de la base de données..."
  touch /app/prisma/safeguard.db
fi

# Exécuter les migrations Prisma
echo "🔄 Exécution des migrations Prisma..."
cd /app
prisma migrate deploy 2>/dev/null || prisma db push 2>/dev/null || {
  echo "⚠️  Avertissement: Les migrations ont échoué, mais on continue..."
  echo "   Cela peut être normal si la base de données est déjà à jour."
}

# Générer le client Prisma si nécessaire (au cas où il ne serait pas dans le build)
echo "🔧 Vérification du client Prisma..."
prisma generate 2>/dev/null || {
  echo "⚠️  Avertissement: La génération du client Prisma a échoué."
  echo "   Le client devrait déjà être inclus dans le build standalone."
}

echo "✅ Initialisation terminée, démarrage du serveur..."

# Démarrer le serveur Next.js
exec node server.js

