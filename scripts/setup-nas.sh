#!/bin/bash

# Script d'installation sur le NAS (à exécuter depuis le NAS)
# Ce script configure et démarre l'application si le build existe déjà

set -e

echo "🏠 Configuration SafeGuard sur NAS..."
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Vérifier si le build existe
if [ ! -d ".next/standalone" ]; then
    echo "❌ Erreur: Aucun build trouvé (.next/standalone n'existe pas)"
    echo ""
    echo "Le build doit être créé depuis votre machine locale :"
    echo "  1. Sur votre machine: npm run prisma:generate"
    echo "  2. Sur votre machine: npm run build"
    echo "  3. Copier .next/standalone sur le NAS"
    echo ""
    echo "Ou utilisez le script de déploiement depuis votre machine :"
    echo "  ./scripts/deploy-nas.sh admin 192.168.1.100 /volume1/docker/SafeVault"
    exit 1
fi

# Vérifier que Prisma est dans le build
if [ ! -d ".next/standalone/node_modules/.prisma/client" ]; then
    echo "❌ Erreur: Le client Prisma n'est pas dans le build"
    echo "   Le build doit être créé avec 'npm run prisma:generate' avant 'npm run build'"
    exit 1
fi

# Créer .env si nécessaire
if [ ! -f ".env" ]; then
    echo "📝 Création du fichier .env..."
    cat > .env << 'EOF'
DATABASE_URL="file:./prisma/safeguard.db"
NODE_ENV=production
PORT=3003
PDF_SERVICE_URL="http://localhost:3001"
PDF_SERVICE_PROVIDER="browserless"
EOF
    echo "✅ Fichier .env créé (modifiez-le si nécessaire)"
fi

# Créer la base de données si elle n'existe pas
if [ ! -f "prisma/safeguard.db" ]; then
    echo "📊 Création de la base de données vide..."
    touch prisma/safeguard.db
    chmod 666 prisma/safeguard.db
    echo "✅ Base de données créée (sera initialisée au premier accès)"
fi

# Créer le dossier logs
mkdir -p logs
chmod 755 logs

# Modifier ecosystem.config.js avec le bon chemin
CURRENT_PATH=$(pwd)
if [ -f "ecosystem.config.js" ]; then
    sed -i "s|cwd:.*|cwd: '$CURRENT_PATH',|g" ecosystem.config.js
    echo "✅ ecosystem.config.js mis à jour avec le chemin: $CURRENT_PATH"
fi

# Démarrer avec PM2
if command -v pm2 &> /dev/null; then
    echo ""
    echo "🚀 Démarrage avec PM2..."
    pm2 delete safeguard 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    echo ""
    echo "✅ Application démarrée avec PM2 !"
    echo ""
    echo "Commandes utiles:"
    echo "  pm2 status          - Voir le statut"
    echo "  pm2 logs safeguard  - Voir les logs"
    echo "  pm2 restart safeguard - Redémarrer"
else
    echo "⚠️  PM2 n'est pas installé"
    echo "   Installez-le avec: npm install -g pm2"
    echo ""
    echo "Démarrage direct (Ctrl+C pour arrêter):"
    PORT=3003 node .next/standalone/server.js
fi

