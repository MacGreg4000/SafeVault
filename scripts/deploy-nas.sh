#!/bin/bash

# Script de déploiement simple pour NAS Synology
# Usage: ./scripts/deploy-nas.sh [nas-user] [nas-ip] [nas-path]
# OU depuis le NAS: ./scripts/deploy-nas.sh local

set -e

# Vérifier si on est sur le NAS (mode local)
if [ "$1" = "local" ] || [ -z "$1" ] && [ -d "/volume1" ] || [ -d "/volume2" ]; then
    echo "🏠 Mode déploiement local (sur le NAS)"
    echo ""
    
    # Vérifier qu'on est dans le bon répertoire
    if [ ! -f "package.json" ]; then
        echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
        exit 1
    fi
    
    # Vérifier si Node.js est disponible
    if ! command -v node &> /dev/null; then
        echo "❌ Erreur: Node.js n'est pas installé sur le NAS"
        echo "   Le script doit être exécuté depuis votre machine locale"
        echo "   Usage: ./scripts/deploy-nas.sh admin 192.168.1.100 /volume1/docker/safeguard"
        exit 1
    fi
    
    # Vérifier si Prisma peut être généré
    if ! command -v npx &> /dev/null; then
        echo "⚠️  npx n'est pas disponible. Vérification du build..."
        
        # Si le build existe déjà, on peut l'utiliser
        if [ -d ".next/standalone" ] && [ -d ".next/standalone/node_modules/.prisma/client" ]; then
            echo "✅ Build trouvé avec Prisma inclus"
            echo ""
            echo "🚀 Démarrage de l'application..."
            
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
            fi
            
            # Créer la base de données si elle n'existe pas
            if [ ! -f "prisma/safeguard.db" ]; then
                echo "📊 Création de la base de données vide..."
                touch prisma/safeguard.db
                chmod 666 prisma/safeguard.db
            fi
            
            # Démarrer avec PM2
            if command -v pm2 &> /dev/null; then
                pm2 delete safeguard 2>/dev/null || true
                pm2 start ecosystem.config.js
                pm2 save
                echo ""
                echo "✅ Application démarrée avec PM2 !"
                echo "   Vérifiez avec: pm2 status"
            else
                echo "⚠️  PM2 n'est pas installé. Démarrage direct..."
                PORT=3003 node .next/standalone/server.js
            fi
            exit 0
        else
            echo "❌ Erreur: Aucun build trouvé"
            echo "   Le script doit être exécuté depuis votre machine locale pour créer le build"
            echo "   Usage: ./scripts/deploy-nas.sh admin 192.168.1.100 /volume1/docker/safeguard"
            exit 1
        fi
    fi
    
    # Si on arrive ici, on peut générer Prisma et build
    echo "📦 Génération du client Prisma..."
    npm run prisma:generate
    
    # Créer la base de données si elle n'existe pas
    if [ ! -f "prisma/safeguard.db" ]; then
        echo "📊 Création de la base de données..."
        npx prisma migrate deploy 2>/dev/null || npx prisma db push
    fi
    
    # Build
    echo "🔨 Build de l'application..."
    npm run build
    
    # Vérifier que Prisma est dans le build
    if [ ! -d ".next/standalone/node_modules/.prisma/client" ]; then
        echo "❌ Erreur: Le client Prisma n'est pas dans le build"
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
    fi
    
    # Démarrer avec PM2
    if command -v pm2 &> /dev/null; then
        pm2 delete safeguard 2>/dev/null || true
        pm2 start ecosystem.config.js
        pm2 save
        echo ""
        echo "✅ Application démarrée avec PM2 !"
    else
        echo "⚠️  PM2 n'est pas installé. Démarrage direct..."
        PORT=3003 node .next/standalone/server.js
    fi
    
    exit 0
fi

# Mode déploiement depuis machine locale vers NAS
NAS_USER="${1:-admin}"
NAS_IP="${2:-192.168.1.100}"
NAS_PATH="${3:-/volume1/docker/safeguard}"

echo "🚀 Déploiement SafeGuard sur NAS..."
echo "   NAS: $NAS_USER@$NAS_IP:$NAS_PATH"
echo ""

# 1. Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# 2. Générer Prisma
echo "📦 Génération du client Prisma..."
npm run prisma:generate

# 3. Créer la base de données si elle n'existe pas
if [ ! -f "prisma/safeguard.db" ]; then
    echo "📊 Création de la base de données..."
    npx prisma migrate deploy 2>/dev/null || npx prisma db push
fi

# 4. Build
echo "🔨 Build de l'application..."
npm run build

# 5. Vérifier que Prisma est dans le build
if [ ! -d ".next/standalone/node_modules/.prisma/client" ]; then
    echo "❌ Erreur: Le client Prisma n'est pas dans le build"
    echo "   Essayez: npm run prisma:generate && npm run build"
    exit 1
fi

# 6. Créer le fichier .env pour le NAS si il n'existe pas
if [ ! -f ".env.nas" ]; then
    echo "📝 Création du fichier .env.nas..."
    cat > .env.nas << EOF
DATABASE_URL="file:./prisma/safeguard.db"
NODE_ENV=production
PORT=3003
PDF_SERVICE_URL="http://$NAS_IP:3001"
PDF_SERVICE_PROVIDER="browserless"
EOF
fi

# 7. Copier sur le NAS
echo "📤 Copie des fichiers sur le NAS..."
echo "   (Vous devrez peut-être entrer le mot de passe SSH)"

# Créer les dossiers nécessaires sur le NAS
ssh "$NAS_USER@$NAS_IP" "mkdir -p $NAS_PATH/prisma $NAS_PATH/logs"

# Copier les fichiers
scp -r .next/standalone/* "$NAS_USER@$NAS_IP:$NAS_PATH/standalone/"
scp -r prisma/* "$NAS_USER@$NAS_IP:$NAS_PATH/prisma/"
scp ecosystem.config.js "$NAS_USER@$NAS_IP:$NAS_PATH/"
scp .env.nas "$NAS_USER@$NAS_IP:$NAS_PATH/.env"

# 8. Configurer et démarrer sur le NAS
echo "⚙️  Configuration sur le NAS..."
ssh "$NAS_USER@$NAS_IP" << EOF
cd $NAS_PATH

# Modifier ecosystem.config.js avec le bon chemin
sed -i "s|cwd:.*|cwd: '$NAS_PATH',|g" ecosystem.config.js

# Donner les permissions
chmod 666 prisma/safeguard.db 2>/dev/null || true
chmod 755 logs 2>/dev/null || true

# Démarrer avec PM2
pm2 delete safeguard 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "✅ Application démarrée !"
echo "   Accédez à: http://$NAS_IP:3003"
EOF

echo ""
echo "✅ Déploiement terminé !"
echo "   Application disponible sur: http://$NAS_IP:3003"
