#!/bin/sh

echo "🚀 Démarrage de SafeGuard..."

# Vérifier que le dossier prisma existe et est accessible
if [ ! -d "/app/prisma" ]; then
  echo "❌ Erreur: Le dossier /app/prisma n'existe pas!"
  # Ne pas faire échouer le conteneur, continuer quand même
  echo "⚠️  Continuation malgré l'erreur..."
fi

# Ne pas essayer de créer le fichier manuellement
# Prisma le créera automatiquement lors des migrations si nécessaire
echo "📦 Vérification de la base de données..."
if [ -f "/app/prisma/safeguard.db" ]; then
  echo "✅ Base de données trouvée"
else
  echo "ℹ️  Base de données non trouvée, Prisma la créera lors des migrations"
fi

# Exécuter les migrations Prisma (cela créera la base de données si elle n'existe pas)
echo "🔄 Exécution des migrations Prisma..."
cd /app || {
  echo "⚠️  Impossible de changer de répertoire, utilisation du répertoire courant"
  cd /app 2>/dev/null || true
}

# Essayer les migrations, mais ne jamais faire échouer le script
if prisma migrate deploy 2>&1; then
  echo "✅ Migrations appliquées avec succès"
elif prisma db push 2>&1; then
  echo "✅ Schéma de base de données synchronisé"
else
  echo "⚠️  Avertissement: Les migrations ont échoué, mais on continue..."
  echo "   Cela peut être normal si la base de données est déjà à jour ou si les permissions ne sont pas correctes."
  echo "   Le serveur démarrera quand même."
fi

# Générer le client Prisma si nécessaire (au cas où il ne serait pas dans le build)
echo "🔧 Vérification du client Prisma..."
prisma generate 2>&1 || {
  echo "⚠️  Avertissement: La génération du client Prisma a échoué."
  echo "   Le client devrait déjà être inclus dans le build standalone."
}

echo "✅ Initialisation terminée, démarrage du serveur..."

# Démarrer le serveur Next.js (cette commande ne doit jamais échouer)
exec node server.js

