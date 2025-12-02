#!/bin/bash

# Script pour réinitialiser la base de données
# Usage: ./scripts/reset-db.sh [container-name]

CONTAINER_NAME="${1:-safeguard}"

echo "🗑️  Réinitialisation de la base de données SafeGuard..."
echo ""

# Vérifier si le conteneur existe
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Erreur: Le conteneur '${CONTAINER_NAME}' n'existe pas"
    echo ""
    echo "Conteneurs disponibles:"
    docker ps -a --format '{{.Names}}'
    exit 1
fi

# Arrêter le conteneur
echo "⏹️  Arrêt du conteneur..."
docker stop ${CONTAINER_NAME} 2>/dev/null || true

# Supprimer la base de données
echo "🗑️  Suppression de la base de données..."
docker exec ${CONTAINER_NAME} rm -f /app/prisma/safeguard.db 2>/dev/null || \
docker run --rm --volumes-from ${CONTAINER_NAME} alpine rm -f /app/prisma/safeguard.db 2>/dev/null || \
echo "⚠️  Impossible de supprimer depuis le conteneur, suppression depuis l'extérieur..."

# Si le volume est monté, supprimer depuis l'hôte
if [ -f "./prisma/safeguard.db" ]; then
    echo "🗑️  Suppression du fichier local..."
    rm -f ./prisma/safeguard.db
    echo "✅ Fichier local supprimé"
fi

# Redémarrer le conteneur
echo "🚀 Redémarrage du conteneur..."
docker start ${CONTAINER_NAME} 2>/dev/null || docker-compose up -d

echo ""
echo "✅ Base de données réinitialisée !"
echo "   Vous pouvez maintenant accéder à /setup pour créer le premier administrateur"



