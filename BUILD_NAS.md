# ⚠️ IMPORTANT : Build pour NAS

## Ne JAMAIS faire le build sur le NAS

Le build Next.js avec Prisma **DOIT** être fait sur votre machine locale, pas sur le NAS.

## Procédure correcte

### 1. Sur votre machine locale

```bash
# 1. Installer les dépendances
npm install

# 2. Générer le client Prisma (avec les bons binaryTargets)
npm run prisma:generate

# 3. Vérifier que le client Prisma est généré
ls -la node_modules/.prisma/client/

# 4. Build de l'application
npm run build

# 5. Vérifier que le build standalone contient Prisma
ls -la .next/standalone/node_modules/.prisma/client/
ls -la .next/standalone/node_modules/@prisma/client/
```

### 2. Copier sur le NAS

```bash
# Copier uniquement le dossier .next/standalone et les fichiers nécessaires
scp -r .next/standalone user@nas-ip:/volume1/docker/SafeVault/
scp -r prisma user@nas-ip:/volume1/docker/SafeVault/
scp package.json user@nas-ip:/volume1/docker/SafeVault/
scp ecosystem.config.js user@nas-ip:/volume1/docker/SafeVault/
scp next.config.js user@nas-ip:/volume1/docker/SafeVault/
```

### 3. Sur le NAS

```bash
# Installer UNIQUEMENT les dépendances de production (sans build)
npm install --production --ignore-scripts

# Démarrer avec PM2
pm2 start ecosystem.config.js
```

## Pourquoi ne pas builder sur le NAS ?

1. **Prisma nécessite des binaires natifs** qui peuvent causer des segmentation fault
2. **Next.js build nécessite beaucoup de mémoire** et de CPU
3. **Le build standalone inclut déjà tout** ce dont vous avez besoin
4. **Plus rapide et plus fiable** de builder localement

## Si vous voyez "Cannot read properties of undefined (reading 'bind')"

Cela signifie que vous avez essayé de faire le build sur le NAS. **Solution** : Faites le build localement et copiez le résultat.

