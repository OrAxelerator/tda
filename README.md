# Tour de l'As (TDA)

Jeu de cartes multijoueur en ligne, jouable directement dans le navigateur. Le jeu se joue de 2 à 6 joueurs, en temps réel. Il a été inventé par un groupe d'amis, puis recodé pour le web.

Le but est de ne plus avoir de cartes en main avant les autres. Les règles complètes sont dans [`regle.md`](./regle.md).

## Stack

- **Frontend** : React 19, TypeScript, Vite, React Router, Socket.IO client.
- **Backend** : Express 5, Socket.IO, TypeScript (lancé avec `tsx`).
- **Firebase** : authentification (email / mot de passe, Google) et profils dans Firestore.

## Structure

```
tda/
├── frontend/   # application React (interface, accueil, partie, profil)
├── backend/    # serveur Express + Socket.IO, moteur de jeu
├── docs/       # documentation technique
├── regle.md    # règles du jeu
└── cdc.md      # cahier des charges
```

## Installation

Prérequis : Node.js et npm.

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Configuration du backend

Le backend a besoin d'une clé de compte de service Firebase. Crée le fichier `backend/env/env` avec cette ligne (le JSON est lu par une expression régulière dans `backend/src/firebase.ts`, qui attend la ligne `FIREBASE_SERVICE_ACCOUNT=` suivie de l'objet JSON) :

```
FIREBASE_SERVICE_ACCOUNT={ ...contenu du JSON du compte de service... }
```

Ce fichier est ignoré par Git, ne le committe jamais.

## Lancer le projet en local

Dans deux terminaux :

```bash
# Terminal 1 : backend (port 3000)
cd backend
npm run dev

# Terminal 2 : frontend (port 5173)
cd frontend
npm run dev
```

Ouvre ensuite <http://localhost:5173>, crée un compte ou connecte-toi, puis crée ou rejoins une partie.

## Scripts utiles

| Dossier | Commande | Rôle |
| --- | --- | --- |
| `backend` | `npm run dev` | Serveur avec rechargement automatique |
| `backend` | `npm start` | Serveur sans rechargement |
| `frontend` | `npm run dev` | Serveur de développement Vite |
| `frontend` | `npm run build` | Build de production dans `dist/` |
| `frontend` | `npm run lint` | Analyse ESLint |
| `frontend` | `npm run preview` | Prévisualise le build |

Il n'y a pas encore de tests automatisés.

## Documentation

- [`docs/setup.md`](./docs/setup.md) : mise en route pas à pas.
- [`docs/frontend.md`](./docs/frontend.md) : fonctionnement du frontend.
- [`docs/backend.md`](./docs/backend.md) : routes HTTP et événements Socket.IO (partielle).
- [`architecture.md`](./architecture.md) : architecture cible du projet.
- [`BUGS.md`](./BUGS.md) : bugs et optimisations à corriger.

## Bibliothèques tierces

Les licences des bibliothèques utilisées sont listées dans [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
