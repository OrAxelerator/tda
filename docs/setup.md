# Configuration et lancement local

## Prérequis

- Node.js compatible avec les versions récentes de Vite et npm.
- Un projet Firebase configuré pour l’authentification et Firestore.
- Un compte de service Firebase Admin pour le backend.

## Firebase Admin

Le serveur lit ses variables locales dans `backend/env/env` (ce fichier n’est pas versionné). Il doit contenir la variable `FIREBASE_SERVICE_ACCOUNT` avec le JSON du compte de service, par exemple sur une seule ligne :

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

Ne publiez jamais la clé privée du compte de service. En hébergement Render, configurez plutôt `FIREBASE_SERVICE_ACCOUNT` dans les variables d’environnement du service et définissez `RENDER=true`.

## Lancer en développement

Ouvrez deux terminaux à la racine du dépôt :

```sh
cd backend
npm install
npm run dev
```

Le backend écoute sur `http://localhost:3000`. Il charge `backend/public/cards.json` depuis son répertoire courant.

```sh
cd frontend
npm install
npm run dev
```

Vite affiche l’adresse locale, généralement `http://localhost:5173`. Le frontend en développement contacte le backend sur le port 3000.

## Variables de déploiement

- Backend : `PORT` (facultatif, défaut `3000`), `FRONTEND_URL` (origine autorisée), `FIREBASE_SERVICE_ACCOUNT`, `RENDER=true` sur Render.
- Frontend : `VITE_API_URL` doit désigner l’URL publique du backend en production.
- Le client Firebase est actuellement configuré dans `frontend/src/firebase-app.ts`.

## Dépannage

- Erreur d’initialisation Firebase Admin : vérifiez le JSON dans `backend/env/env` et son nom exact.
- Connexion refusée : vérifiez que le backend fonctionne et que son origine est autorisée via `FRONTEND_URL`.
- Paquet de cartes introuvable : lancez le serveur depuis `backend/` afin que `public/cards.json` soit trouvé.
