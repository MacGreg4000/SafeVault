# Déploiement Docker sur NAS Synology

## 🐳 Solution Docker (Recommandé)

Docker résout tous les problèmes de compatibilité Prisma et simplifie grandement le déploiement !

## Prérequis

- Docker installé sur le NAS Synology (via Package Center)
- Docker Compose installé (généralement inclus avec Docker)

## Installation Ultra-Simple

### 1. Cloner le projet sur le NAS

```bash
cd /volume1/docker
git clone https://github.com/MacGreg4000/SafeVault.git
cd SafeVault
```

### 2. Créer le fichier .env

```bash
cat > .env << 'EOF'
DATABASE_URL="file:./prisma/safeguard.db"
NODE_ENV=production
PORT=3003
PDF_SERVICE_URL="http://192.168.1.100:3001"
PDF_SERVICE_PROVIDER="browserless"
EOF
```

**Modifiez** `PDF_SERVICE_URL` avec l'IP de votre NAS si nécessaire.

### 3. Construire et démarrer

```bash
docker-compose up -d --build
```

**C'est tout !** 🎉

L'application sera disponible sur `http://votre-nas-ip:3003`

## Réinitialiser la base de données

Si vous devez réinitialiser la base de données (par exemple pour refaire le setup) :

### Méthode 1 : Script automatique

```bash
./scripts/reset-db.sh safeguard
```

### Méthode 2 : Manuellement

```bash
# Arrêter le conteneur
docker-compose stop

# Supprimer la base de données
rm -f prisma/safeguard.db

# Redémarrer
docker-compose up -d
```

### Méthode 3 : Depuis le conteneur

```bash
# Entrer dans le conteneur
docker exec -it safeguard sh

# Supprimer la base de données
rm /app/prisma/safeguard.db

# Sortir
exit

# Redémarrer le conteneur
docker-compose restart safeguard
```

## Commandes utiles

### Voir les logs
```bash
docker-compose logs -f safeguard
```

### Redémarrer
```bash
docker-compose restart safeguard
```

### Arrêter
```bash
docker-compose stop safeguard
```

### Mettre à jour
```bash
git pull
docker-compose up -d --build
```

### Voir le statut
```bash
docker-compose ps
```

## Structure des volumes

- `./prisma` : Base de données SQLite (persistante)
- `./logs` : Logs de l'application (optionnel)

## Configuration avancée

### Modifier le port

Éditez `docker-compose.yml` :

```yaml
ports:
  - "3005:3003"  # Port externe:port interne
```

### Modifier les variables d'environnement

Éditez le fichier `.env` ou `docker-compose.yml` :

```yaml
environment:
  - PDF_SERVICE_URL=http://192.168.1.100:3001
```

Puis redémarrez :
```bash
docker-compose up -d
```

## Avantages de Docker

✅ **Pas de problème de binaires Prisma** - Tout est dans le conteneur  
✅ **Isolation** - Pas de conflit avec d'autres applications  
✅ **Simple** - Une seule commande pour tout  
✅ **Portable** - Fonctionne sur n'importe quel NAS avec Docker  
✅ **Mise à jour facile** - `git pull` + `docker-compose up -d --build`

## Dépannage

### Le conteneur ne démarre pas

```bash
# Voir les logs
docker-compose logs safeguard

# Vérifier les erreurs de build
docker-compose build --no-cache
```

### Erreur de permissions sur la base de données

```bash
# Donner les permissions
chmod 666 prisma/safeguard.db
chown 1001:1001 prisma/safeguard.db
```

### Rebuild complet

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Réinitialiser complètement

```bash
# Arrêter et supprimer
docker-compose down

# Supprimer la base de données
rm -f prisma/safeguard.db

# Rebuild et redémarrer
docker-compose up -d --build
```

## Interface Docker DSM (Synology)

Vous pouvez aussi utiliser l'interface graphique de Synology :

1. Ouvrez **Container Manager** (ou Docker)
2. Cliquez sur **Project** (ou **Compose**)
3. Cliquez sur **Create**
4. Sélectionnez le dossier `SafeVault`
5. Le fichier `docker-compose.yml` sera détecté automatiquement
6. Cliquez sur **Create** et **Start**

C'est encore plus simple ! 🚀
