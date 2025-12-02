#!/bin/sh
# Script d'entrée Docker qui initialise la DB en root puis démarre l'app en nextjs

# Exécuter l'initialisation de la base de données en root
/app/init-db.sh

# Passer à l'utilisateur nextjs et démarrer l'application
exec su nextjs -c "/app/start.sh"

