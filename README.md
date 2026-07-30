# Prumme

Todo list avec suivi d'historique, thème forêt. Données stockées dans le navigateur (LocalStorage).

## Stack

- React + TypeScript + Vite
- React Router
- Zustand
- Tailwind CSS (thème forêt centralisé)
- date-fns
- Architecture feature-based, prête pour une future API

## Démarrage

```bash
npm install
npm run dev
```

## Build & déploiement GitHub Pages

Le `base` Vite est configuré sur `/leafitome/` (nom du dépôt).

```bash
npm run deploy
```

Cela build le projet, copie `index.html` → `404.html` (SPA), et publie le dossier `dist` via `gh-pages`.

Ensuite, dans les settings GitHub du dépôt : **Pages** → source **Deploy from a branch** → branche **`gh-pages`** / dossier **`/` (root)**.

L'URL sera : `https://prumme.github.io/leafitome/`

Si le dépôt a un autre nom, mets à jour `base` dans `vite.config.ts` et `homepage` dans `package.json`.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Tâches du jour / semaine / mois |
| `/dashboard` | Récap complétion + reste à faire |
| `/recurrences` | Gestion des todos et récurrences |

## Entités

- **Todo** — définition + récurrence (`DAILY` \| `WEEKLY` \| `MONTHLY` \| `ONDAY`)
- **History** — occurrence par date (`DONE` \| `MISSED`)

Les tâches passées sans entrée d'historique sont considérées comme `MISSED` à l'affichage.
