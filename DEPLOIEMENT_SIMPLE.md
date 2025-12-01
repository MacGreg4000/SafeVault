# Déploiement Simple sur NAS Synology

## Méthode Ultra-Simple (1 seule commande)

### Prérequis
- Accès SSH au NAS
- PM2 installé sur le NAS : `npm install -g pm2`
- Script de déploiement configuré

### Déploiement en 1 commande

```bash
./scripts/deploy-nas.sh admin 192.168.1.100 /volume1/docker/safeguard
```

**C'est tout !** Le script fait :
1. ✅ Génère le client Prisma
2. ✅ Crée la base de données
3. ✅ Build l'application
4. ✅ Copie tout sur le NAS
5. ✅ Configure et démarre avec PM2

### Configuration

Éditez le script `scripts/deploy-nas.sh` et modifiez les valeurs par défaut :

```bash
NAS_USER="${1:-admin}"           # Votre utilisateur NAS
NAS_IP="${2:-192.168.1.100}"    # IP de votre NAS
NAS_PATH="${3:-/volume1/docker/safeguard}"  # Chemin sur le NAS
```

Ensuite, utilisez simplement :

```bash
./scripts/deploy-nas.sh
```

## Méthode Manuelle (3 étapes)

Si vous préférez faire manuellement :

### 1. Préparer localement

```bash
npm run prisma:generate
npx prisma db push  # Si la DB n'existe pas
npm run build
```

### 2. Copier sur le NAS

```bash
scp -r .next/standalone/* admin@192.168.1.100:/volume1/docker/safeguard/standalone/
scp -r prisma/* admin@192.168.1.100:/volume1/docker/safeguard/prisma/
scp ecosystem.config.js admin@192.168.1.100:/volume1/docker/safeguard/
```

### 3. Démarrer sur le NAS

```bash
ssh admin@192.168.1.100
cd /volume1/docker/safeguard

# Créer .env
echo 'DATABASE_URL="file:./prisma/safeguard.db"
NODE_ENV=production
PORT=3003' > .env

# Modifier ecosystem.config.js (changer le chemin cwd)
nano ecosystem.config.js

# Démarrer
pm2 start ecosystem.config.js
pm2 save
```

## Mise à jour

Pour mettre à jour l'application :

```bash
# Même commande qu'au premier déploiement
./scripts/deploy-nas.sh
```

Le script redémarre automatiquement l'application.

## Dépannage

### L'application ne démarre pas

```bash
ssh admin@192.168.1.100
cd /volume1/docker/safeguard
pm2 logs safeguard
```

### Vérifier que Prisma est présent

```bash
ssh admin@192.168.1.100
ls -la /volume1/docker/safeguard/standalone/node_modules/.prisma/client/
```

Si ce dossier n'existe pas, le build n'a pas fonctionné. Relancez :

```bash
npm run prisma:generate
npm run build
```

Puis redéployez.

