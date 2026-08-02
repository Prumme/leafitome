# Leafitome — Gestion / Ops

> Doc pour reprendre le projet dans X mois sans rien avoir oublié.  
> Complète la note produit : [leafitome.md](./leafitome.md).

---

## Accès rapide

| Quoi | Valeur |
|------|--------|
| Site | https://leafitome.prumme.dev |
| Health API | https://leafitome.prumme.dev/api/health |
| IP VPS | `212.47.245.210` |
| Hébergeur | Scaleway (instance) |
| Hostname Scaleway (exemple) | `scw-interesting-ellis` |
| DNS | `A` `leafitome.prumme.dev` → `212.47.245.210` |
| Projet sur le serveur | `/opt/leafitome` |
| Projet en local (Mac) | `~/Documents/Projets/todo-prumme` |

---

## Connexion SSH

```bash
ssh root@212.47.245.210
```

Si ça échoue : vérifier la clé SSH dans Scaleway, ou l’utilisateur (`root` / `ubuntu`).

Une fois connecté :

```bash
cd /opt/leafitome
pwd   # doit afficher /opt/leafitome
```

---

## Architecture sur le serveur

```text
Internet
   │
   ▼
Caddy (:80 / :443)  ← HTTPS Let's Encrypt auto
   ├─ /        → front (build Vite dans l’image)
   └─ /api/*   → API Hono (container api:3001)
                    └─ Postgres (réseau Docker interne, pas exposé)
```

Containers Docker (noms) :

- `leafitome-caddy`
- `leafitome-api`
- `leafitome-postgres`

Fichiers importants sur le VPS :

- `/opt/leafitome/` — code cloné depuis Git
- `/opt/leafitome/.env.production` — secrets (chmod 600)
- `/opt/leafitome/.env` — **copie utilisée par Compose pour l’interpolation** (voir piège ci-dessous)
- `/opt/leafitome/docker-compose.prod.yml` — stack prod

Volumes Docker persistants :

- données Postgres
- certificats / config Caddy

---

## Secrets (ne pas committer)

Fichiers :

- `.env.production` (référence)
- `.env` (souvent une copie pour que `docker compose` lise bien les variables)

Variables clés :

- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`
- `JWT_SECRET`
- `CORS_ORIGIN=https://leafitome.prumme.dev`
- `COOKIE_SECURE=true`

Générer un secret :

```bash
openssl rand -hex 32
```

> Les mots de passe ne vont **pas** dans ces fichiers markdown en clair. Stocke-les dans un gestionnaire de mots de passe.

---

## Piège Docker Compose (important)

Compose remplace `${POSTGRES_PASSWORD}` dans le YAML via un fichier **`.env`** par défaut.

`--env-file .env.production` ne marche pas toujours pour cette interpolation.

**Solution qui a marché :**

```bash
cd /opt/leafitome
cp .env.production .env
chmod 600 .env
docker compose -f docker-compose.prod.yml up -d --build
```

Ensuite les commandes peuvent souvent se faire sans `--env-file` si `.env` est présent.

---

## Commandes quotidiennes (sur le VPS)

```bash
cd /opt/leafitome

# Statut
docker compose -f docker-compose.prod.yml ps

# Logs
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f caddy
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs --tail=100 postgres

# Health
curl -s https://leafitome.prumme.dev/api/health
```

---

## Déployer une nouvelle version

### Sur le Mac

1. Coder / commit
2. `git push` vers GitHub

### Sur le VPS

```bash
cd /opt/leafitome
git pull
# s’assurer que .env existe (copie de .env.production si besoin)
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

Les migrations SQL partent au démarrage de l’API.

---

## Développement local (Mac)

```bash
cd ~/Documents/Projets/todo-prumme

# Postgres local (port 5433)
docker compose up -d

npm install
npm run dev:api    # http://localhost:3001
npm run dev:web    # http://localhost:5173
```

Env local API : `apps/api/.env`  
Exemple global : `.env.example`  
Prod example : `.env.production.example`

---

## Firewall VPS (UFW)

Ports ouverts normalement :

- `22` SSH
- `80` HTTP (challenge + redirect)
- `443` HTTPS

```bash
ufw status
```

---

## Checklist « je reviens dans 6 mois »

1. [ ] Scaleway : instance toujours active / facturation OK
2. [ ] `dig +short leafitome.prumme.dev` → IP du VPS
3. [ ] `ssh root@212.47.245.210`
4. [ ] `cd /opt/leafitome && docker compose -f docker-compose.prod.yml ps`
5. [ ] https://leafitome.prumme.dev et `/api/health`
6. [ ] Cloner / pull le repo local si besoin
7. [ ] Relire `consignes.md` à la racine du repo si doute

---

## Dépannage express

| Symptôme | Action |
|----------|--------|
| Site down | SSH → `docker compose … ps` → `logs` |
| Erreur `POSTGRES_PASSWORD requis` | Créer/copier `.env` depuis `.env.production` |
| HTTPS cassé | DNS + ports 80/443 + `logs caddy` |
| API 502 | `logs api` — BDD up ? |
| Login KO | `CORS_ORIGIN` + `COOKIE_SECURE` |
| Port 3001 déjà pris (local) | `lsof -iTCP:3001 -sTCP:LISTEN` puis `kill -9 <pid>` |

---

## Ce qui est automatique

- Renouvellement certificats TLS → **Caddy**
- Redémarrage containers après reboot VPS → `restart: unless-stopped`
- Migrations schéma → **API au boot**

---

## Admin `/admin`

Dashboard de monitoring (comptes + todos, modération activer/archiver).

1. Définir `ADMIN_PASSWORD` dans `.env` / `.env.production` (et compose)
2. Ouvrir `https://leafitome.prumme.dev/admin`
3. Mot de passe → session **2 h** (cookie httpOnly + token local)
4. Sans `ADMIN_PASSWORD`, le login admin renvoie 503

Ne pas exposer ce mot de passe ; ce n’est pas un compte utilisateur.

Badges utiles : email vérifié / non vérifié, bloqué, purge possible (≥ 14 j sans vérif).
Actions : bloquer / débloquer / supprimer (si bloqué ou non vérifié depuis 14 jours).

---

## Emails (Resend)

Templates HTML Leafitome (vert) pour : validation d’email, mot de passe oublié, changement de mot de passe.

| Variable | Rôle |
|---|---|
| `RESEND_API_KEY` | Clé API Resend (vide = envoi désactivé) |
| `EMAIL_FROM` | Expéditeur, ex. `Leafitome <hello@leafitome.prumme.dev>` |
| `APP_URL` | Base des liens dans les mails (`/verify-email`, `/reset-password`) |

La validation d’email n’est **pas** demandée à l’inscription : dialog dans l’app, fermable.
Après **14 jours** sans vérification, un admin peut bloquer ou supprimer le compte.
Un compte bloqué ne peut plus se connecter (message explicite au login).

Tant que le DNS Resend n’est pas validé, garder `RESEND_API_KEY` vide ou utiliser le domaine de test Resend.

---

## WebSocket (todos partagées)

Sync temps réel check/uncheck + messages inbox via `GET /ws?token=…` (upgrade WebSocket).

- Dev : proxy Vite `ws: true` sur `/api`
- Prod : Caddy `reverse_proxy` gère déjà le WebSocket sur `/api/*`
- Relancer l’API après déploiement pour activer `@hono/node-ws`

---

## Notifications Web Push (app fermée)

Les rappels partent **depuis l’API** via Web Push + Service Worker.

| Élément | Détail |
|---------|--------|
| Prefs | Table `notification_prefs` (heure, jours, only_if_incomplete, timezone) |
| Abonnements | Table `push_subscriptions` |
| Scheduler | Toutes les 60s dans le process API |
| SW | `apps/web/src/sw.ts` (events `push` + `notificationclick`) |
| Test | Profil → « Tester une notification » → `POST /notifications/test` |

### Déploiement / secrets VAPID

Sur le VPS, générer des clés **dédiées prod** (ne pas réutiliser le local) :

```bash
cd /opt/leafitome
npx web-push generate-vapid-keys
```

Ajouter dans `.env` **et** `.env.production` :

```bash
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:hello@prumme.dev
```

Puis rebuild :

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Sans ces variables, le compose refuse de démarrer l’API (`VAPID_PUBLIC_KEY requis`).

### Côté utilisateur

1. Installer la PWA (surtout iOS : « Sur l’écran d’accueil »)
2. Profil → activer les rappels → autoriser le navigateur
3. Choisir heure / jours
4. Fermer l’app : le push arrive quand même

### Limites navigateur

- **iOS** : PWA installée + iOS 16.4+
- Changer de téléphone : réactiver une fois les notifs sur le nouvel appareil
- Révoquer une notif côté OS : l’API nettoie les subscriptions 404/410

---

## Liens utiles

- Console Scaleway (instances / facturation)
- DNS du domaine `prumme.dev`
- Repo GitHub du projet
- Fichier repo : `consignes.md` (guide déploiement détaillé)
- Note produit : [leafitome.md](./leafitome.md)
