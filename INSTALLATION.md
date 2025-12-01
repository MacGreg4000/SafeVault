# Guide d'installation SafeGuard

## Prérequis

- Node.js 18+ installé sur votre NAS Synology
- Service Puppeteer externe tournant sur le port 3001
- PM2 installé globalement (`npm install -g pm2`)

## Installation

### 1. Cloner ou copier le projet

```bash
cd /path/to/your/projects
# Copiez le dossier SafeVault ici
```

### 2. Installer les dépendances

```bash
cd SafeVault
npm install
```

### 3. Configurer la base de données

Créez un fichier `.env` à la racine du projet :

```bash
DATABASE_URL="file:./prisma/safeguard.db"
PDF_SERVICE_URL="http://192.168.0.250:3001"
PDF_SERVICE_PROVIDER="browserless"
# Optionnel : si votre service Browserless nécessite un token
# PDF_SERVICE_TOKEN="votre_token_ici"
# Optionnel : désactiver le fallback local Puppeteer (par défaut: true)
# PDF_USE_LOCAL_FALLBACK="false"
```

**Note** : 
- **Important** : Utilisez l'adresse IP de votre NAS (ex: `192.168.0.250`) au lieu de `localhost` si l'application tourne sur le NAS. Si Browserless tourne dans un conteneur Docker sur le même NAS, utilisez l'IP du NAS.
- **Système de fallback** : L'application essaie d'abord de se connecter au service Browserless en réseau. Si celui-ci n'est pas disponible, elle utilise automatiquement Puppeteer local (si installé). Pour désactiver le fallback local, définissez `PDF_USE_LOCAL_FALLBACK="false"`.
- L'ancienne variable `PUPPETEER_BROWSER_URL` est toujours supportée pour la rétrocompatibilité.
- Si votre service Browserless nécessite une authentification, vous pouvez soit :
  - Ajouter le token dans l'URL : `PDF_SERVICE_URL="http://192.168.0.250:3001?token=VOTRE_TOKEN"`
  - Ou utiliser la variable `PDF_SERVICE_TOKEN` séparément.

### 4. Initialiser Prisma

**Important** : Les migrations Prisma sont déjà incluses dans le dépôt. Vous n'avez pas besoin de les créer.

```bash
# Le client Prisma sera généré automatiquement lors de npm install
# (grâce au script postinstall dans package.json)

# Appliquer les migrations existantes (créera la base de données)
npm run prisma:migrate:deploy
```

Cette commande créera le fichier `prisma/safeguard.db` (base SQLite) en appliquant les migrations déjà présentes dans le dépôt.

### 5. Construire l'application

```bash
npm run build
```

### 6. Configurer PM2

Éditez le fichier `ecosystem.config.js` et modifiez le chemin `cwd` avec le chemin absolu de votre projet :

```javascript
cwd: '/volume1/docker/safeguard', // Exemple pour Synology
```

### 7. Démarrer avec PM2

```bash
# Démarrer l'application
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2 pour le démarrage automatique
pm2 save
pm2 startup
```

### 8. Accéder à l'application

Ouvrez votre navigateur et accédez à :
- `http://votre-nas-ip:3003`

Lors du premier accès, vous serez redirigé vers le wizard de configuration pour créer le premier administrateur et le premier coffre-fort.

## Commandes utiles

### PM2

```bash
# Voir les logs
pm2 logs safeguard

# Redémarrer l'application
pm2 restart safeguard

# Arrêter l'application
pm2 stop safeguard

# Voir le statut
pm2 status
```

### Prisma

```bash
# Ouvrir Prisma Studio (interface graphique pour la DB)
npm run prisma:studio

# Créer une nouvelle migration
npm run prisma:migrate
```

## Structure de la base de données

La base de données SQLite est stockée dans :
```
prisma/safeguard.db
```

**Important** : Assurez-vous de faire des sauvegardes régulières de ce fichier !

## Configuration du service Puppeteer

L'application se connecte à un service Puppeteer externe sur le port 3001. Assurez-vous que ce service est démarré et accessible avant d'utiliser la fonctionnalité d'export PDF.

## Dépannage

### L'application ne démarre pas

1. Vérifiez que le port 3003 n'est pas déjà utilisé
2. Vérifiez les logs : `pm2 logs safeguard`
3. Vérifiez que la base de données existe : `ls -la prisma/safeguard.db`

### Erreur de connexion à Puppeteer

1. Vérifiez que le service Puppeteer tourne sur le port 3001
2. Testez la connexion : `curl http://localhost:3001/json/version`

### Problèmes de permissions

Assurez-vous que l'utilisateur qui exécute PM2 a les droits d'écriture sur :
- Le dossier `prisma/`
- Le dossier `.next/`
- Le dossier `logs/` (créé automatiquement par PM2)

