#!/bin/bash

# Script de préparation pour le déploiement sur NAS
# Ce script prépare tous les fichiers nécessaires pour déployer sur le NAS
# sans avoir besoin d'exécuter Prisma sur le NAS

set -e

echo "🚀 Préparation du déploiement NAS..."

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# 1. Générer le client Prisma
echo "📦 Génération du client Prisma..."
npm run prisma:generate

# 2. Vérifier que la base de données existe
if [ ! -f "prisma/safeguard.db" ]; then
    echo "⚠️  Base de données non trouvée. Création..."
    npx prisma migrate deploy || npx prisma db push
fi

# 3. Build de l'application
echo "🔨 Build de l'application..."
npm run build

# 4. Vérifier que le client Prisma est dans le build
if [ ! -d ".next/standalone/node_modules/.prisma/client" ]; then
    echo "❌ Erreur: Le client Prisma n'est pas dans le build standalone"
    echo "   Vérifiez que 'npm run prisma:generate' a été exécuté avant le build"
    exit 1
fi

# 5. Créer le dossier de déploiement
DEPLOY_DIR="deploy-nas"
echo "📁 Création du dossier de déploiement: $DEPLOY_DIR"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# 6. Copier les fichiers nécessaires
echo "📋 Copie des fichiers..."
cp -r .next/standalone "$DEPLOY_DIR/"
cp -r prisma "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp ecosystem.config.js "$DEPLOY_DIR/"
cp next.config.js "$DEPLOY_DIR/"

# 7. Créer le fichier .env.example
cat > "$DEPLOY_DIR/.env.example" << 'EOF'
DATABASE_URL="file:./prisma/safeguard.db"
NODE_ENV=production
PORT=3003
PDF_SERVICE_URL="http://192.168.0.250:3001"
PDF_SERVICE_PROVIDER="browserless"
EOF

# 8. Créer un README pour le NAS
cat > "$DEPLOY_DIR/README-NAS.md" << 'EOF'
# Déploiement sur NAS

## Fichiers inclus

- `standalone/` : Build Next.js avec le client Prisma inclus
- `prisma/` : Schéma et base de données SQLite
- `ecosystem.config.js` : Configuration PM2
- `.env.example` : Exemple de configuration

## Installation

1. Copier tous les fichiers sur le NAS (via SCP ou SFTP)
2. Créer le fichier `.env` à partir de `.env.example`
3. Modifier `ecosystem.config.js` pour pointer vers le bon chemin
4. Démarrer avec PM2 : `pm2 start ecosystem.config.js`

## Important

- Ne PAS exécuter `npm install` sur le NAS
- Ne PAS exécuter `prisma generate` sur le NAS
- Tout est déjà inclus dans le build standalone
EOF

echo ""
echo "✅ Préparation terminée !"
echo ""
echo "📦 Dossier de déploiement créé: $DEPLOY_DIR"
echo ""
echo "📤 Pour transférer sur le NAS:"
echo "   scp -r $DEPLOY_DIR/* user@nas-ip:/volume1/docker/safeguard/"
echo ""
echo "📝 N'oubliez pas de:"
echo "   1. Créer le fichier .env sur le NAS"
echo "   2. Modifier ecosystem.config.js avec le bon chemin"
echo "   3. Démarrer avec PM2"

