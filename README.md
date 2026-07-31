# Leafitome

Todo list avec suivi d’historique, thème forêt. Données synchronisées via API + PostgreSQL. Installable en **PWA**.

## Stack (V2)

- **Front** (`apps/web`) — React + TypeScript + Vite + Zustand + Tailwind
- **API** (`apps/api`) — Hono + PostgreSQL
- **Auth** — email + mot de passe (JWT + cookie)
- **Prod** — Docker Compose + Caddy (HTTPS) sur Scaleway → https://leafitome.prumme.dev

## Démarrage local

### 1. Base de données

```bash
docker compose up -d
```

Postgres écoute sur le port **5433** (évite les conflits avec un Postgres local sur 5432).

### 2. Dépendances

```bash
npm install
```

### 3. Lancer API + front

```bash
npm run dev:api
npm run dev:web
```

- Front : [http://localhost:5173](http://localhost:5173)
- API : [http://localhost:3001](http://localhost:3001) (proxy Vite `/api` → API)

Variables API : `apps/api/.env` (voir `.env.example`).

### Parcours

1. Landing `/`
2. Inscription `/register` ou connexion `/login`
3. App protégée sous `/app`, `/app/dashboard`, `/app/recurrences`

## Production (VPS)

Voir le guide détaillé : **[consignes.md](./consignes.md)**

En résumé sur le serveur :

```bash
cp .env.production.example .env.production
# éditer les secrets
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## Structure

```text
apps/
  web/     # React (Vite)
  api/     # Hono
deploy/
  Caddyfile
docker-compose.yml       # Postgres local
docker-compose.prod.yml  # Postgres + API + Caddy
```
