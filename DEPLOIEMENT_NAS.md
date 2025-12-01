# Guide de Déploiement sur NAS Synology

⚠️ **IMPORTANT** : Le NAS Synology ne peut généralement **PAS** exécuter les commandes Prisma (`prisma generate`, `prisma db push`). 

La solution est de **tout préparer localement** et de déployer uniquement les fichiers nécessaires en utilisant le mode **standalone** de Next.js qui inclut automatiquement le client Prisma généré.

## 🚀 Déploiement Ultra-Simple (Recommandé)

**Pour une installation rapide, utilisez le script automatique :**

```bash
./scripts/deploy-nas.sh admin 192.168.1.100 /volume1/docker/safeguard
```

C'est tout ! Le script fait tout automatiquement. Voir [DEPLOIEMENT_SIMPLE.md](./DEPLOIEMENT_SIMPLE.md) pour plus de détails.

---

## Guide Détaillé (si vous préférez faire manuellement)

## Prérequis

- Machine locale avec Node.js pour préparer le build
- Accès SSH au NAS Synology
- PM2 installé globalement sur le NAS
- Node.js sur le NAS (uniquement pour exécuter le build standalone, pas pour Prisma)

## Solution : Build Standalone avec Prisma inclus

Next.js en mode `standalone` inclut automatiquement le client Prisma généré dans le build. Il suffit de :
1. **Générer le client Prisma localement** avant le build
2. **Build l'application** (le client Prisma sera inclus dans `.next/standalone`)
3. **Copier uniquement les fichiers nécessaires** sur le NAS

## Étapes de déploiement

### 1. Préparation locale (sur votre machine) - OBLIGATOIRE

```bash
# 1. Aller dans le projet
cd /Users/gregory/Desktop/SafeVault

# 2. Installer les dépendances (si pas déjà fait)
npm install

# 3. Générer le client Prisma localement (OBLIGATOIRE avant le build)
npm run prisma:generate

# 4. Créer/pousser le schéma de base de données (si nécessaire)
# Option A : Utiliser les migrations existantes
npx prisma migrate deploy

# Option B : Pousser directement (si pas de migrations)
npx prisma db push

# 5. Vérifier que le fichier de base de données existe
ls -la prisma/safeguard.db

# 6. Build de l'application (le client Prisma sera inclus dans .next/standalone)
npm run build

# 7. Vérifier que le client Prisma est dans le build standalone
ls -la .next/standalone/node_modules/.prisma/client/
# Vous devriez voir les fichiers générés (index.d.ts, index.js, etc.)
```

### 2. Utiliser le script de préparation automatique

Un script est disponible pour automatiser tout le processus :

```bash
# Exécuter le script de préparation
./scripts/prepare-nas-deploy.sh
```

Ce script :
- Génère le client Prisma localement
- Vérifie/crée la base de données
- Build l'application
- Crée un dossier `deploy-nas/` avec tous les fichiers nécessaires
- Vérifie que le client Prisma est inclus dans le build

### 3. Préparer les fichiers manuellement (alternative)

Si vous préférez le faire manuellement :

```bash
# Créer un dossier de déploiement
mkdir -p deploy-nas
cd deploy-nas

# Copier le build standalone
cp -r ../.next/standalone ./

# Copier les fichiers nécessaires
cp -r ../prisma ./
cp ../package.json ./
cp ../ecosystem.config.js ./
cp ../next.config.js ./

# Créer le fichier .env.example
cat > .env.example << 'EOF'
DATABASE_URL="file:./prisma/safeguard.db"
NODE_ENV=production
PORT=3003
PDF_SERVICE_URL="http://192.168.0.250:3001"
PDF_SERVICE_PROVIDER="browserless"
EOF
```

### 4. Transfert vers le NAS

```bash
# Sur votre machine locale, depuis le dossier deploy-nas (ou depuis la racine)
scp -r deploy-nas/* user@nas-ip:/volume1/docker/safeguard/
```

Ou si vous avez préparé manuellement :

```bash
scp -r .next/standalone user@nas-ip:/volume1/docker/safeguard/
scp -r prisma user@nas-ip:/volume1/docker/safeguard/
scp package.json ecosystem.config.js next.config.js user@nas-ip:/volume1/docker/safeguard/
```

### 5. Configuration sur le NAS

```bash
# 1. Se connecter au NAS via SSH
ssh user@nas-ip

# 2. Aller dans le répertoire du projet
cd /volume1/docker/safeguard

# 3. Vérifier que les fichiers sont présents
ls -la
# Vous devriez voir : standalone/, prisma/, package.json, ecosystem.config.js

# 4. Vérifier que le client Prisma est présent (CRITIQUE)
ls -la standalone/node_modules/.prisma/client/
# Si ce dossier n'existe pas, le build n'a pas fonctionné correctement
# Vous devriez voir : index.d.ts, index.js, schema.prisma, etc.

# 5. Créer le fichier .env
nano .env
```

Contenu du fichier `.env` :
```env
DATABASE_URL="file:./prisma/safeguard.db"
NODE_ENV=production
PORT=3003
PDF_SERVICE_URL="http://192.168.0.250:3001"
PDF_SERVICE_PROVIDER="browserless"
```

### 6. Vérifier les permissions

```bash
# Donner les bonnes permissions à la base de données
chmod 666 prisma/safeguard.db
chown votre-user:votre-group prisma/safeguard.db

# Créer le dossier logs pour PM2
mkdir -p logs
chmod 755 logs
```

### 7. Configuration PM2

Éditez `ecosystem.config.js` pour pointer vers le bon chemin :

```javascript
module.exports = {
  apps: [
    {
      name: 'safeguard',
      script: 'node',
      args: 'standalone/server.js',
      cwd: '/volume1/docker/safeguard', // ⚠️ MODIFIER avec le chemin absolu sur le NAS
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        HOSTNAME: '0.0.0.0',
        DATABASE_URL: 'file:./prisma/safeguard.db',
        PDF_SERVICE_URL: 'http://192.168.0.250:3001', // ⚠️ MODIFIER avec l'IP de votre NAS
        PDF_SERVICE_PROVIDER: 'browserless',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
}
```

### 8. Démarrage sur le NAS

```bash
# 1. Démarrer avec PM2
pm2 start ecosystem.config.js

# 2. Sauvegarder la configuration PM2
pm2 save
pm2 startup  # Suivre les instructions affichées

# 3. Vérifier le statut
pm2 status
pm2 logs safeguard
```

### 9. Accéder à l'application

Ouvrez votre navigateur et accédez à :
- `http://votre-nas-ip:3003`

Lors du premier accès, vous serez redirigé vers le wizard de configuration pour créer le premier administrateur et le premier coffre-fort.

## Gestion de la base de données

### Créer la base de données initiale

**IMPORTANT** : La base de données doit être créée **localement** avant le déploiement.

```bash
# Sur votre machine locale
cd /Users/gregory/Desktop/SafeVault
npx prisma migrate deploy
# OU
npx prisma db push
```

Ensuite, copiez-la vers le NAS lors du déploiement.

### Mettre à jour le schéma de la base de données

Si vous modifiez le schéma Prisma :

1. **Sur votre machine locale** :
   ```bash
   # Modifier prisma/schema.prisma
   
   # Créer une nouvelle migration
   npx prisma migrate dev --name nom_de_la_migration
   
   # OU pousser directement les changements
   npx prisma db push
   
   # Régénérer le client Prisma
   npm run prisma:generate
   
   # Rebuild l'application
   npm run build
   ```

2. **Redéployer sur le NAS** :
   ```bash
   # Copier la nouvelle base de données
   scp prisma/safeguard.db user@nas-ip:/volume1/docker/safeguard/prisma/
   
   # Copier le nouveau build
   scp -r .next/standalone/* user@nas-ip:/volume1/docker/safeguard/standalone/
   
   # Redémarrer sur le NAS
   ssh user@nas-ip "cd /volume1/docker/safeguard && pm2 restart safeguard"
   ```

## Dépannage

### Le client Prisma n'est pas dans le build

Si le client Prisma n'est pas inclus dans `.next/standalone/node_modules/.prisma/client/` :

```bash
# Sur votre machine locale
# 1. Vérifier que Prisma est généré
ls -la node_modules/.prisma/client/

# 2. Si absent, régénérer
npm run prisma:generate

# 3. Rebuild
npm run build

# 4. Vérifier à nouveau
ls -la .next/standalone/node_modules/.prisma/client/
```

**IMPORTANT** : Ne jamais essayer de générer Prisma sur le NAS. Tout doit être fait localement avant le build.

### Erreur de permissions sur la base de données

```bash
# Donner les bonnes permissions
chmod 666 prisma/safeguard.db
chown node:node prisma/safeguard.db  # ou votre utilisateur
```

### PM2 ne démarre pas

```bash
# Vérifier les logs
pm2 logs safeguard --lines 50

# Vérifier la configuration
cat ecosystem.config.js

# Vérifier que le client Prisma est présent
ls -la standalone/node_modules/.prisma/client/

# Redémarrer PM2
pm2 restart safeguard
pm2 save
```

### Erreur "Cannot find module '@prisma/client'"

Cela signifie que le client Prisma n'est pas dans le build. Vérifiez :

```bash
# Sur le NAS
ls -la standalone/node_modules/@prisma/client/
ls -la standalone/node_modules/.prisma/client/

# Si ces dossiers n'existent pas, le build n'a pas fonctionné correctement
# Il faut rebuild localement avec prisma:generate exécuté avant
```

## Structure des fichiers sur le NAS

```
/volume1/docker/safeguard/
├── .env                    # Configuration (à créer manuellement)
├── package.json
├── ecosystem.config.js
├── next.config.js
├── standalone/             # Build Next.js avec Prisma inclus
│   └── node_modules/
│       ├── @prisma/
│       │   └── client/
│       └── .prisma/
│           └── client/     # ⚠️ CRITIQUE : Client Prisma généré
├── prisma/
│   ├── schema.prisma       # Schéma de la base de données
│   ├── safeguard.db         # Base de données SQLite
│   └── migrations/         # Migrations Prisma
└── logs/                   # Logs PM2
```

## Notes importantes

1. **⚠️ Le NAS ne peut PAS exécuter Prisma** : Tout doit être préparé localement
2. **Le build standalone** inclut automatiquement le client Prisma généré
3. **La base de données SQLite** doit être créée localement avant le déploiement
4. **Les migrations Prisma** sont dans `prisma/migrations/` et sont versionnées dans Git
5. **Le fichier `.env`** ne doit PAS être commité (déjà dans `.gitignore`)
6. **Pas besoin de `npm install` sur le NAS** : Tout est dans le build standalone
7. **Vérifiez toujours** que `standalone/node_modules/.prisma/client/` existe sur le NAS avant de démarrer

## Commandes utiles

### Sur votre machine locale

```bash
# Préparer le déploiement
./scripts/prepare-nas-deploy.sh

# Ou manuellement
npm run prisma:generate
npm run build
```

### Sur le NAS

```bash
# Vérifier le statut
pm2 status

# Voir les logs
pm2 logs safeguard

# Redémarrer
pm2 restart safeguard

# Arrêter
pm2 stop safeguard
```
