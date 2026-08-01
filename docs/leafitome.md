# Leafitome

> App de suivi de tâches au thème forêt — « fais pousser tes habitudes, une feuille à la fois ».

**URL prod :** https://leafitome.prumme.dev  
**Repo local :** `~/Documents/Projets/todo-prumme`  
**Domaine :** sous-domaine de `prumme.dev`

---

## En une phrase

Leafitome est une todo list récurrence + historique + gamification légère (streak, badges, heatmap), avec comptes utilisateurs, sync multi-appareils, et installable en PWA.

---

## Intention produit

- Suivre des tâches **récurrentes** (quotidien / hebdo / mensuel / jours choisis)
- Voir clairement ce qui est **fait / manqué / en attente**
- Motiver sans surcharge : thème forêt, animations douces, badges, célébration « Feuille-tastique ! »
- Rester **simple, gratuit (pour l’instant), sécurisé**, sans pub

---

## Fonctionnalités principales

### Auth & accès

- Landing marketing publique
- Inscription / connexion (email + mot de passe)
- App protégée derrière auth (`/app/*`)
- Vérification email : **pas encore** (prévu plus tard)

### Tâches

- CRUD des todos / récurrences
- Priorités, couleurs, activation / archive
- Complétion anticipée possible (hebdo / mensuel)
- Todos à **échéance** (`ONDAY`) : faisables jusqu’à une deadline, relançables en changeant la date (hors streak / heatmap)
- Filtres période : Aujourd’hui / Semaine / Mois
- Export / import JSON (sauvegarde)

### Dashboard

- Stats de complétion
- Heatmap d’activité (12 semaines)
- Historique au clic sur un jour (dialog)
- Carte **Série** (streak) avec arbre qui pousse
- Badges (débloqués en premier, toast + son)
- « Reste à faire aujourd’hui »

### UX / polish

- Animations de validation (ondulations, etc.)
- Transitions de page
- Célébration quand la journée est terminée
- PWA installable (mobile / desktop)

---

## Stack technique

| Couche | Techno |
|--------|--------|
| Front | React, TypeScript, Vite, Zustand, Tailwind, React Router |
| API | Hono (Node) |
| BDD | PostgreSQL |
| Auth | JWT + cookie httpOnly, bcrypt |
| Local | Docker Compose (Postgres :5433) |
| Prod | Docker Compose + Caddy (HTTPS auto) sur Scaleway |

### Structure repo

```text
apps/web     → frontend
apps/api     → backend
deploy/      → Caddyfile
docker-compose.yml       → Postgres local
docker-compose.prod.yml  → prod (postgres + api + caddy)
docs/        → documentation projet
```

---

## Modèle de données (simplifié)

- **users** — compte (email, password hash)
- **todos** — définitions + récurrence
- **history_entries** — statut DONE / MISSED par jour planifié
- **user_badges** (+ flag voyageur export/import)

Les occurrences du calendrier sont surtout **calculées** ; on ne stocke que les validations / manques.

---

## Parcours utilisateur

1. Landing `/`
2. Register `/register` ou Login `/login`
3. App :
   - `/app` — tâches
   - `/app/dashboard` — recap / heatmap / badges / streak
   - `/app/recurrences` — gestion + export/import
   - `/app/profile` — surnom + préférences de notifications (Web Push)

---

## Infra prod

- **VPS :** Scaleway (`212.47.245.210`)
- **DNS :** `A leafitome.prumme.dev → IP VPS`
- **HTTPS :** Caddy + Let’s Encrypt (renouvellement auto)
- **Secrets :** `.env` / `.env.production` sur le serveur (pas dans Git)
- **Guide ops :** [ops.md](./ops.md) + `consignes.md` à la racine du repo

---

## État actuel (août 2026)

- [x] V1 locale (LocalStorage) puis migration V2 API + comptes
- [x] Déployé en prod, compte créé, site accessible
- [x] Profil + Web Push (rappels même app fermée)
- [ ] Vérification email / magic link
- [ ] Améliorations produit à venir

---

## Voir aussi

- [Gestion / Ops](./ops.md) — SSH, serveur, déploiement, dépannage
