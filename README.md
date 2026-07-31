# Leafitome

Todo list avec suivi d’historique, thème forêt. Données stockées dans le navigateur (LocalStorage). Installable en **PWA** sur mobile et desktop.

## Stack

- React + TypeScript + Vite
- React Router
- Zustand
- Tailwind CSS (thème forêt centralisé)
- date-fns
- vite-plugin-pwa (service worker + manifeste)
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

L’URL sera : [https://prumme.github.io/leafitome/](https://prumme.github.io/leafitome/)

Si le dépôt a un autre nom, mets à jour `base` dans `vite.config.ts`, `homepage` dans `package.json`, et `start_url` / `scope` du manifeste PWA.

## Installer l’app sur mobile (PWA)

Après un déploiement à jour (`npm run deploy`), ouvre le site en **HTTPS** (GitHub Pages le fournit déjà).

### iPhone / iPad (Safari)

1. Ouvre [https://prumme.github.io/leafitome/](https://prumme.github.io/leafitome/) dans **Safari** (pas Chrome).
2. Tape le bouton **Partager** (carré avec flèche).
3. Choisis **Sur l’écran d’accueil**.
4. Confirme **Ajouter**.
5. L’icône Leafitome apparaît comme une app : elle s’ouvre en plein écran (standalone).

### Android (Chrome)

1. Ouvre [https://prumme.github.io/leafitome/](https://prumme.github.io/leafitome/) dans **Chrome**.
2. Menu **⋮** → **Installer l’application** / **Ajouter à l’écran d’accueil**.
   - Ou la bannière « Installer » si elle s’affiche.
3. Confirme. L’app est disponible depuis le tiroir / l’écran d’accueil.

### Desktop (Chrome / Edge)

1. Ouvre le site.
2. Icône **installer** dans la barre d’adresse (ou menu → Installer Leafitome).

> Les données restent **locales au navigateur / appareil**. Pour changer de téléphone, utilise **Exporter / Importer** sur la page Récurrences.

Voir aussi [consignes.md](./consignes.md) pour la checklist côté propriétaire du dépôt.

## Icônes PWA

Si tu modifies `public/favicon.svg` :

```bash
npm run icons
```

Cela régénère `pwa-192x192.png`, `pwa-512x512.png`, `pwa-512x512-maskable.png` et `apple-touch-icon.png`.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Tâches du jour / semaine / mois |
| `/dashboard` | Récap, heatmap, streak, reste à faire |
| `/recurrences` | Gestion des todos + export / import JSON |

## Entités

- **Todo** — définition + récurrence (`DAILY` \| `WEEKLY` \| `MONTHLY` \| `ONDAY`)
- **History** — occurrence par date (`DONE` \| `MISSED`)

Les tâches passées sans entrée d’historique sont considérées comme `MISSED` à l’affichage.
