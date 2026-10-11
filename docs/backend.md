# Backend (documentation partielle)

Le backend est un serveur **Express 5 + Socket.IO** en TypeScript, lancé avec `tsx`. Il gère les parties en mémoire et vérifie les règles avec le moteur de jeu (`src/game/GameEngine.ts`). Firebase Admin sert à vérifier les utilisateurs et à mettre à jour les statistiques.

> Cette page est incomplète. Elle couvre seulement les routes et les événements principaux.

## Lancer le serveur

```bash
cd backend
npm run dev     # avec rechargement automatique
npm start       # sans rechargement
```

Le serveur écoute sur le port `3000` (ou `PORT` s'il est défini).

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | JSON du compte de service Firebase. En local, il est lu dans `backend/env/env` (`FIREBASE_SERVICE_ACCOUNT={...}`). |
| `RENDER` | Mettre à `true` en production : la clé est lue depuis les variables d'environnement, et non depuis le fichier. |
| `FRONTEND_URL` | Origine autorisée en plus de `localhost:5173` / `5174` (CORS). |
| `PORT` | Port d'écoute (défaut `3000`). |

## Routes HTTP

Toutes les routes renvoient du JSON avec un champ `success`.

### `POST /api/createGame`
Crée une room et ajoute l'hôte comme joueur.
- **En-tête** : `Authorization: Bearer <idToken Firebase>` (obligatoire).
- **Corps** : `{ "bots": 2 }` (nombre de bots à ajouter).
- **Réponse** : `{ "success": true, "roomId": "..." }`.

### `POST /rooms/:roomId/joinGame`
Ajoute un joueur à une room en attente.
- **Corps** : `{ "playerId": "...", "playerName": "..." }`.
- Refusé si la room est pleine (6 joueurs) ou si le joueur est déjà présent.

### `POST /rooms/:roomId/startGame`
Démarre la partie. Il faut entre 2 et 6 joueurs. Le deck est chargé depuis `public/cards.json`.

### `POST /rooms/:roomId/leave`
Retire un joueur de la room.
- **Corps** : `{ "playerId": "..." }`.

## Événements Socket.IO

Le client se connecte à la racine du serveur (`SOCKET_URL`), en transport WebSocket.

| Événement (client → serveur) | Charge utile | Effet |
| --- | --- | --- |
| `joinRoom` | `{ roomId, playerId?, playerName? }` (ou simplement `roomId`) | Rejoint la room Socket.IO et envoie l'état. |
| `playCard` | `{ roomId, userId, cardIds }` | Joue une ou plusieurs cartes (4 maximum, même valeur). |
| `takePile` | `{ roomId, userId }` | Le joueur prend la pile de la tour. |

| Événement (serveur → client) | Contenu |
| --- | --- |
| `gameUpdate` | État de la partie. Chaque socket reçoit sa propre main dans `yourCard`. |
| `gameError` | `{ message }` quand une action est refusée. |

Le serveur envoie `gameUpdate` à chaque changement, puis les clients se mettent à jour.

## Fichiers clés

- `src/index.ts` : serveur Express, routes HTTP, gestion Socket.IO.
- `src/firebase.ts` : initialisation de Firebase Admin.
- `src/game/` : moteur de jeu (règles, pioche, tours, bots).
- `public/cards.json` : définition des 54 cartes.

## À compléter

- Détail des règles appliquées dans `GameEngine` (pose de cartes, volée, super tour).
- Comportement des bots (`playBotTurn`).
- Gestion des déconnexions.
- Format exact des erreurs renvoyées.
