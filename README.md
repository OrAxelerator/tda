# Tour de l’As

Tour de l’As est un jeu de cartes multijoueur jouable depuis un navigateur. Le projet est principalement présenté comme une démonstration en ligne ; son lancement local nécessite une configuration Firebase et des variables d’environnement adaptées.

### Jouer en ligne

[Accéder à Tour de l’As](https://tda-1.onrender.com/home)

## Démarrage rapide

Le lancement local est destiné au développement. Il nécessite Node.js, npm, une configuration Firebase et les variables du serveur décrites dans [docs/setup.md](docs/setup.md).

Dans deux terminaux, depuis la racine du dépôt :

```sh
cd backend && npm install && npm run dev
```

```sh
cd frontend && npm install && npm run dev
```

Ouvrez <http://localhost:5173>, créez un compte ou connectez-vous, puis créez ou rejoignez une partie.

## Structure

- `frontend/` : interface React, TypeScript et Vite.
- `backend/src/game/` : moteur, état, joueurs et cartes.
- `backend/src/index.ts` : API HTTP et événements multijoueur Socket.IO.
- `backend/public/cards.json` : données du paquet utilisé par le serveur.
- `docs/` : configuration et repères pour le frontend.
- `regle.md` : règles détaillées du jeu.

Les actions de jeu passent par le backend et le moteur. Socket.IO diffuse les mises à jour de partie. Firebase fournit l’authentification et les services de données utilisés par l’application.

## Commandes utiles

Dans `frontend/` : `npm run dev`, `npm run build`, `npm run lint`.

Dans `backend/` : `npm run dev` (redémarrage automatique) ou `npm start`.

Voir [docs/setup.md](docs/setup.md) pour le lancement local et [docs/frontend.md](docs/frontend.md) pour les routes et les principaux composants.
