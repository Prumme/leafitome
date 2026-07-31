# Consignes — PWA Leafitome

Checklist de ce que **tu** dois faire de ton côté pour que l’installation mobile fonctionne.

## 1. Déployer la version PWA

Dans le projet :

```bash
npm run deploy
```

Attends la fin du script `gh-pages`. Vérifie ensuite que le site est bien en ligne :

[https://prumme.github.io/leafitome/](https://prumme.github.io/leafitome/)

## 2. Vérifier GitHub Pages

Dans le dépôt GitHub → **Settings** → **Pages** :

- Source : branche **`gh-pages`**
- Dossier : **`/` (root)**

Sans ça, le service worker et le manifeste ne seront pas servis correctement.

## 3. Tester l’installabilité (optionnel mais utile)

Sur un ordi, ouvre Chrome → DevTools → onglet **Application** :

- **Manifest** : nom Leafitome, icônes 192 / 512 présentes
- **Service workers** : un worker actif sur `/leafitome/`

Sur mobile, tu peux aussi utiliser [https://www.pwabuilder.com/](https://www.pwabuilder.com/) en collant l’URL du site pour un rapport rapide.

## 4. Installer sur ton téléphone

### iOS (important)

- Utilise **Safari** uniquement pour « Sur l’écran d’accueil ».
- Chrome / Firefox iOS ne proposent en général **pas** la vraie installation PWA.
- Après install, ouvre l’icône depuis l’écran d’accueil (pas un onglet Safari).

### Android

- **Chrome** → menu → Installer / Ajouter à l’écran d’accueil.

Détails pas à pas : voir la section **Installer l’app sur mobile** du [README.md](./README.md).

## 5. Données entre appareils

La PWA ne synchronise **pas** le cloud.

Pour migrer téléphone ↔ ordi :

1. Page **Récurrences** → bouton **Exporter** (télécharge un JSON).
2. Sur l’autre appareil → **Importer** → déposer le fichier.

Fais une export de sécurité avant un import (l’import remplace tout).

## 6. Si l’install ne propose rien

| Cause probable | Action |
|----------------|--------|
| Ancien déploiement sans PWA | Relancer `npm run deploy` |
| Pas en HTTPS | Utiliser l’URL GitHub Pages (déjà HTTPS) |
| Cache navigateur | Vider le cache / ouvrir en navigation privée puis réessayer |
| iOS hors Safari | Repasser sur Safari |
| Mauvais `base` / scope | Vérifier que l’URL contient bien `/leafitome/` |

## 7. Rien d’autre à configurer côté Apple / Google

Pas besoin de compte développeur Apple ou Google Play pour une PWA installée depuis le navigateur. Tu n’as **pas** à publier sur les stores pour cet usage.
