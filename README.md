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
- ✅ Base de données SQLite locale (pas de serveur externe)

## Stack Technique

- **Framework** : Next.js 15 (App Router)
- **Language** : TypeScript
- **Base de données** : SQLite avec Prisma ORM
- **UI** : Tailwind CSS + Framer Motion
- **Déploiement** : Node.js avec PM2

## Installation

Voir le fichier [INSTALLATION.md](./INSTALLATION.md) pour les instructions détaillées.

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Configurer la base de données
npm run prisma:generate
npm run prisma:migrate

# Construire l'application
npm run build

# Démarrer avec PM2
pm2 start ecosystem.config.js
```

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

L'application nécessite un service Puppeteer externe tournant sur le port 3001 pour la génération de PDF. Configurez l'URL dans le fichier `.env` :

```
PUPPETEER_BROWSER_URL="http://localhost:3001"
```

## Licence

Propriétaire

