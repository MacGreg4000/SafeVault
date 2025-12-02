#!/bin/bash
# Script pour installer sans générer Prisma (pour NAS)
# Usage: SKIP_PRISMA=1 npm install

if [ "$SKIP_PRISMA" = "1" ]; then
  echo "⚠️  SKIP_PRISMA activé - Prisma generate sera ignoré"
  npm install --ignore-scripts
else
  npm install
fi

