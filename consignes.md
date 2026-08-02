# Consignes — déploiement Leafitome (Scaleway)

Ce que **toi** dois faire sur le VPS et côté DNS.  
Les fichiers Docker / Caddy sont déjà dans le repo.

**Cible :** https://leafitome.prumme.dev  
**IP VPS :** `212.47.245.210`

---

## 0. Prérequis déjà faits (à vérifier)

- [x] VPS Scaleway créé
- [x] DNS `A` → `leafitome.prumme.dev` → `212.47.245.210`

Vérifie la propagation (depuis ton Mac) :

```bash
dig +short leafitome.prumme.dev
```

Doit afficher `212.47.245.210`. Si vide, attends quelques minutes.

---

## 1. Connexion SSH

```bash
ssh root@212.47.245.210
```

(Adapte l’utilisateur si Scaleway t’a donné `ubuntu` ou un user custom.)

---

## 2. Sécurité de base + Docker (une seule fois)

Sur le VPS :

```bash
apt update && apt upgrade -y
apt install -y curl git ufw

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

curl -fsSL https://get.docker.com | sh
```

Vérifie :

```bash
docker --version
docker compose version
```

---

## 3. Pousser le code sur GitHub (depuis ton Mac)

Dans le projet local, commit + push sur ton dépôt GitHub (si ce n’est pas déjà fait).

Sur le VPS tu clonerás ce dépôt.  
Si le repo est **privé**, crée un **Deploy key** ou un **Personal Access Token** GitHub pour le clone.

---

## 4. Installer Leafitome sur le VPS

Toujours en SSH sur le VPS :

```bash
mkdir -p /opt/leafitome
cd /opt/leafitome
git clone https://github.com/TON_USER/TON_REPO.git .
```

Remplace `TON_USER/TON_REPO` par ton vrai dépôt.

### Fichier secrets

```bash
cp .env.production.example .env.production
nano .env.production
```

**Obligatoire :** change au minimum :

| Variable | Action |
|----------|--------|
| `POSTGRES_PASSWORD` | Mot de passe fort (différent du local) |
| `JWT_SECRET` | Longue chaîne aléatoire |

Pour générer un secret :

```bash
openssl rand -hex 32
```

Exemple de contenu final :

```env
POSTGRES_USER=leafitome
POSTGRES_PASSWORD=...ton-mot-de-passe...
POSTGRES_DB=leafitome

JWT_SECRET=...sortie-openssl...
CORS_ORIGIN=https://leafitome.prumme.dev
COOKIE_SECURE=true

# Web Push (générer : npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:hello@prumme.dev

# Dashboard /admin
ADMIN_PASSWORD=...mot-de-passe-admin-fort...
```

Puis :

```bash
chmod 600 .env.production
```

> Sans `VAPID_*`, le compose prod refuse de démarrer l’API. Détails : `docs/ops.md` § Notifications.

---

## 5. Lancer la prod

```bash
cd /opt/leafitome
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Suivre les logs (surtout Caddy pour le certificat HTTPS) :

```bash
docker compose -f docker-compose.prod.yml logs -f caddy
```

Au premier démarrage, Caddy demande un certificat Let’s Encrypt pour `leafitome.prumme.dev` (renouvellement automatique ensuite).

---

## 6. Vérifications

Dans le navigateur :

1. https://leafitome.prumme.dev → landing  
2. Créer un compte / se connecter  
3. https://leafitome.prumme.dev/api/health → `{"ok":true,"service":"leafitome-api"}`

Depuis le VPS :

```bash
curl -s https://leafitome.prumme.dev/api/health
```

---

## 7. Mises à jour (plus tard)

```bash
cd /opt/leafitome
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

---

## 8. Commandes utiles

```bash
# Statut
docker compose -f docker-compose.prod.yml ps

# Logs
docker compose -f docker-compose.prod.yml logs -f

# Arrêter
docker compose -f docker-compose.prod.yml --env-file .env.production down
```

---

## 9. Si ça ne marche pas

| Problème | Piste |
|----------|--------|
| Certificat HTTPS échoue | DNS pas encore propagé, ou ports 80/443 fermés (`ufw status`) |
| Site inaccessible | `docker compose … ps` — containers up ? |
| `/api/health` 502 | API pas démarrée : `docker compose … logs api` |
| Login impossible | Vérifier `CORS_ORIGIN` et `COOKIE_SECURE=true` dans `.env.production` |
| `git clone` refuse | Repo privé → token / deploy key |

---

## 10. PWA mobile (après mise en ligne)

Même principe qu’avant, mais avec la **nouvelle URL** :

- iOS Safari → Partager → Sur l’écran d’accueil → https://leafitome.prumme.dev  
- Android Chrome → Installer l’application  

Les données sont maintenant liées à **ton compte** (plus besoin d’export pour synchroniser entre appareils du même user).

---

## 11. Ce que tu n’as pas à gérer

- Renouvellement HTTPS → **Caddy** s’en charge  
- Migrations SQL → l’API les applique au démarrage  
- Exposition Postgres sur Internet → **non** (réseau Docker interne uniquement)
