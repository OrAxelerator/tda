# Repères frontend

Le client se trouve dans `frontend/src/`. Il utilise React, TypeScript, React Router et Socket.IO Client.

## Routes
 
- `/home` : accueil et accès aux actions de partie.
- `/login` et `/register` : connexion et création de compte.
- `/user` et `/user/:uid` : profil, routes protégées.
- `/game/:roomCode` : partie, route protégée.
- `/` redirige vers `/home` ; les chemins inconnus redirigent vers `/home`.

`AuthProvider` partage l’état d’authentification. `ProtectedRoute` renvoie les visiteurs non connectés vers `/login`; `PublicRoute` renvoie les utilisateurs connectés vers `/user`.

## Composants principaux

- `components/Home.tsx` : accueil et création ou accès aux parties.
- `components/Game.tsx` : écran de jeu et échanges temps réel.
- `components/Waiting.tsx` : salle d’attente.
- `components/Card.tsx` et `components/Pile.tsx` : affichage des cartes et de la pile.
- `pages/Profile.tsx`, `pages/login.tsx`, `pages/SignUp.tsx` : profil et authentification.
- `config.ts` : construction des URL HTTP et URL Socket.IO.
- `firebase-app.ts` : initialisation Firebase côté navigateur.

## Communication avec le backend

En développement, les appels HTTP utilisent l’origine courante et Socket.IO se connecte à `http://localhost:3000`. En production, `VITE_API_URL` donne l’URL du backend et sert aussi d’hôte Socket.IO.

Les événements Socket.IO utilisés pour le jeu incluent `joinRoom`, `playCard`, `takePile`, `gameUpdate` et `gameError`. Les endpoints HTTP et leurs paramètres sont définis dans `backend/src/index.ts`.

## Commandes

Depuis `frontend/` : `npm run dev` lance Vite, `npm run build` produit la version de production, `npm run preview` la sert localement et `npm run lint` lance ESLint.
