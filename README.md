# SafeGuard

Application de gestion de coffres-forts avec comptage de billets en temps réel.

## Fonctionnalités

- ✅ Gestion multi-coffres avec permissions utilisateurs
- ✅ Comptage de billets Euro (5€, 10€, 20€, 50€, 100€, 200€, 500€)
- ✅ Deux modes de transaction :
  - **Inventaire** : Remplacement complet du contenu
  - **Mouvement** : Ajout ou retrait de billets
- ✅ Historique complet des transactions
- ✅ Export PDF des transactions (via service Puppeteer externe)
- ✅ Interface moderne avec Tailwind CSS et Framer Motion
- ✅ Base de données MySQL/MariaDB avec phpMyAdmin

## Stack Technique

- **Framework** : Next.js 15 (App Router)
- **Language** : TypeScript
- **Base de données** : MySQL/MariaDB avec Prisma ORM
- **UI** : Tailwind CSS + Framer Motion
- **Déploiement** : Node.js avec PM2

## Installation

Voir le fichier [INSTALLATION.md](./INSTALLATION.md) pour les instructions détaillées.

## Démarrage rapide

### Installation locale

```bash
# Installer les dépendances
npm install

# Configurer la base de données MySQL
# 1. Créer la base de données MySQL/MariaDB
# 2. Configurer DATABASE_URL dans .env (voir .env.example)
# 3. Générer le client Prisma et appliquer les migrations
npm run prisma:generate
npm run prisma:migrate

# Construire l'application
npm run build

# Démarrer avec PM2
pm2 start ecosystem.config.js
```

### Installation sur NAS (Synology)

**Important** : Le client Prisma doit être généré localement avant le déploiement sur le NAS.

```bash
# Sur votre machine locale (AVANT de déployer sur le NAS)
npm install
npm run prisma:generate
npm run build

# Sur le NAS, installer SANS générer Prisma
SKIP_PRISMA=1 npm install --ignore-scripts

# Ou utiliser le script
./scripts/skip-prisma-generate.sh
```

Le client Prisma sera inclus dans le build `.next/standalone` et n'a pas besoin d'être régénéré sur le NAS.

## Structure du projet

```
SafeVault/
├── app/                    # Pages Next.js (App Router)
│   ├── actions/           # Server Actions
│   ├── safes/             # Pages de gestion des coffres
│   ├── setup/             # Wizard de configuration initiale
│   └── login/             # Page de connexion
├── lib/                   # Utilitaires
│   ├── prisma.ts         # Client Prisma
│   ├── auth.ts           # Fonctions d'authentification
│   ├── bills.ts          # Utilitaires pour les billets
│   └── pdf-service.ts    # Service PDF (Puppeteer)
├── prisma/
│   └── schema.prisma     # Schéma de base de données
└── ecosystem.config.js    # Configuration PM2
```

## Configuration

### Base de données MySQL/MariaDB

Créez un fichier `.env` à la racine du projet avec la configuration suivante :

```
DATABASE_URL="mysql://user:password@host:port/database"
```

Exemple :
```
DATABASE_URL="mysql://safeguard_user:safeguard_password@localhost:3306/safeguard_db"
```

**Important** : Assurez-vous que la base de données MySQL/MariaDB est créée avant de lancer les migrations.

### Service PDF

L'application nécessite un service Puppeteer externe (Browserless recommandé) tournant sur le port 3001 pour la génération de PDF. Configurez les variables dans le fichier `.env` :

```
PDF_SERVICE_URL="http://192.168.0.250:3001"
PDF_SERVICE_PROVIDER="browserless"
# Optionnel : si votre service Browserless nécessite un token
# PDF_SERVICE_TOKEN="votre_token_ici"
# Optionnel : désactiver le fallback local Puppeteer (par défaut: true)
# PDF_USE_LOCAL_FALLBACK="false"
```

**Note** : 
- **Important** : Utilisez l'adresse IP de votre NAS (ex: `192.168.0.250`) au lieu de `localhost` si l'application tourne sur le NAS. Si Browserless tourne dans un conteneur Docker sur le même NAS, utilisez l'IP du NAS.
- **Système de fallback** : L'application essaie d'abord de se connecter au service Browserless en réseau. Si celui-ci n'est pas disponible, elle utilise automatiquement Puppeteer local (si installé via `npm install puppeteer`). Pour désactiver le fallback local, définissez `PDF_USE_LOCAL_FALLBACK="false"`.
- L'ancienne variable `PUPPETEER_BROWSER_URL` est toujours supportée pour la rétrocompatibilité.
- Si votre service Browserless nécessite une authentification, vous pouvez soit :
  - Ajouter le token dans l'URL : `PDF_SERVICE_URL="http://192.168.0.250:3001?token=VOTRE_TOKEN"`
  - Ou utiliser la variable `PDF_SERVICE_TOKEN` séparément.

## Licence

Propriétaire

