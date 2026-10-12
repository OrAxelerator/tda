# Bugs et optimisations à corriger

Liste issue de la revue du code (serveur et frontend). Les chemins sont relatifs à la racine du projet.

Légende priorité : 🔴 critique (sécurité) · 🟠 bug probable · 🟡 dette / perf / propreté

---

## Serveur (`backend/`)

### 🔴 1. Aucune authentification sur les actions de jeu
- **Où** : `backend/src/index.ts` — événements `joinRoom`, `playCard`, `takePile` ; routes `POST /rooms/:roomId/startGame` et `POST /rooms/:roomId/leave`.
- **Problème** : le `userId` / `playerId` est lu depuis le payload, sans vérification. Quelqu'un qui connaît l'uid d'un autre joueur peut jouer ou quitter à sa place. Les uids sont visibles dans `gameUpdate`.
- **Piste** : vérifier le token Firebase à la connexion Socket.IO (`io.use`) et utiliser `decoded.uid`. Faire de même sur les routes REST (`Authorization: Bearer`).

### 🔴 2. Les mains de tous les joueurs sont envoyées à chaque client (!a garder pour le dev)
- **Où** : `backend/src/index.ts`, `createGameUpdatePayload` → `state: serializeState(state)`.
- **Problème** : `serializeState` inclut `hand` pour chaque joueur. Le commentaire `// everything, bad` le reconnaît. Le frontend n'utilise que `state.players` (id, nom, isHost).
- **Piste** : retirer les mains de ce champ, ne garder que `yourCard` par socket.

### ✅ 3. Nombre de bots non borné (corrigé)
- **Où** : `backend/src/index.ts`, route `POST /api/createGame` ; validation dans `backend/src/validation.ts`.
- **Problème** : une valeur comme `NaN` ou `10000` était acceptée. Risque de déni de service (création massive de bots).
- **Correction** : `parseBotCount` accepte un entier de 0 à 5 (absent = 0), sinon la route répond `400`.

### ✅ 4. `createGame` utilise un deck global potentiellement vide (corrigé)
- **Où** : `backend/src/index.ts`, variable globale `availableCards`, utilisée dans `createGame` (`availableCards.map(...)`).
- **Problème** : `availableCards` n'est rempli qu'au premier `startGame`. Une room créée après le boot du serveur, avant tout démarrage, reçoit un deck vide. `startGame` le remplace ensuite, donc le bug est masqué, mais la logique est fausse.
- **Piste** : charger `backend/public/cards.json` une seule fois au démarrage et l'utiliser partout.

### 🟠 5. Déconnexion : le joueur reste dans la partie
- **Où** : `backend/src/index.ts`, handler `disconnect`.
- **Problème** : un joueur déconnecté reste dans `state.players`. Le tour peut rester bloqué sur lui. Le cas `players.length <= 1` supprime la partie, mais rien d'autre n'est géré.
- **Piste** : décider du comportement voulu (bot de remplacement, passage automatique du tour, ou fin de partie) et l'implémenter.

### ✅ 6. Pioche dupliquée au `takePile` (corrigé)
- **Où** : `backend/src/game/GameEngine.ts` (`takePile`, qui recharge les joueurs à 1-2 cartes) et `backend/src/index.ts` (handler `takePile`, qui appelle `refullPlayer` sur tous les joueurs).
- **Problème** : le recomplètement est fait deux fois. Le résultat est correct, mais c'est redondant.
- **Correction** : le recomplètement est uniquement dans le moteur, qui inclut désormais le preneur (règle de `regle.md`). Le handler et `playBotTurn` attendent `takePile` avec `await`.

### 🟠 7. `playCards` n'est probablement pas atomique
- **Où** : `backend/src/game/GameEngine.ts`, méthode `playCards`.
- **Problème** : une erreur levée en milieu de traitement peut laisser l'état partiellement modifié (cartes retirées de la main sans être ajoutées à la pile, etc.). À vérifier : je n'ai pas lu toute la fin de la fonction.
- **Piste** : valider tout avant de muter l'état, ou travailler sur une copie.

### 🟡 8. `console.log` partout (73 occurrences)
- **Où** : surtout `backend/src/index.ts` ; `console.log(roomEngines)` dans `getEngineForRoom` affiche toute la Map à chaque appel.
- **Piste** : supprimer, ou passer derrière un flag `DEBUG`.

### 🟡 9. Code mort et héritage
- **Où** : `backend/src/index.ts`
  - `updateRoomState` est un no-op appelé à plusieurs endroits.
  - `const db = firebase.firestore()` en haut du fichier n'est jamais utilisé (la route en crée une autre).
  - Imports Firebase client inutiles : `doc`, `getDoc`, `getFirestore` depuis `firebase/firestore`.
  - Singleton `engine` et `currentRoomId`, retour de l'ancien système à une seule partie.
  - `getEngineForRoom` a un fallback sur ce singleton.
- **Piste** : supprimer ce code, et faire de la Map `roomEngines` la seule source.

### 🟡 10. Payload recalculé par socket
- **Où** : `backend/src/index.ts`, `emitGameUpdate` appelle `createGameUpdatePayload` pour chaque socket.
- **Piste** : calculer la partie publique une fois, puis ajouter seulement `yourCard` par socket.

### 🟡 11. Validation de `roomId` absente
- **Où** : `backend/src/index.ts`, routes REST et événements socket.
- **Problème** : `roomId` n'est pas validé (format, longueur).
- **Piste** : valider avant d'interroger la Map.

### 🟡 12. Fichier des cartes relu à chaque démarrage
- **Où** : `backend/src/index.ts`, route `startGame` (`readFile` de `cards.json`).
- **Piste** : lire une fois au boot (voir point 4).

---

## Frontend (`frontend/`)

### 🟠 13. Easter egg `/michel` cassé en production
- **Où** : `frontend/src/App.tsx`, route `/michel` : `<img src="/src/assets/michel.png">`.
- **Problème** : `michel.png` n'est pas dans `dist/` après `npm run build` (seul le chemin apparaît dans le bundle JS). L'image ne s'affiche donc pas hors dev.
- **Piste** : déplacer l'image dans `frontend/public/`, ou l'importer comme module.

### 🟠 14. Lint : `setSocket` appelé dans un effet
- **Où** : `frontend/src/components/Game.tsx`, ligne ~135 (`setSocket(newSocket)` dans le `useEffect` de connexion).
- **Problème** : règle `react-hooks/set-state-in-effect` (erreur de lint). Corriger demande de revoir la façon dont le socket est stocké (ref, ou création hors effet).

### ✅ 15. Lint : dépendance manquante dans l'effet clavier (corrigé)
- **Où** : `frontend/src/components/Game.tsx`, effet `keydown` qui appelle `playSelectedCards`.
- **Problème** : `playSelectedCards` n'est pas dans les dépendances. Ajouter la fonction telle quelle ferait réenregistrer le listener à chaque rendu. Risque de closure périmée : la touche Entrée peut utiliser une ancienne valeur de `playerHand` ou de `selectedCards`.
- **Piste** : mémoïser `playSelectedCards` avec `useCallback` et lister ses dépendances réelles.
- **Correction** : `isSelectedCardValid` et `playSelectedCards` sont en `useCallback` avec leurs dépendances réelles, placés avant le `return` conditionnel. L'effet clavier écoute `playSelectedCards`. `getCardFromId` est sorti du composant (fonction pure). Les `console.log` de débogage de ces fonctions ont été retirés.

### 🟡 16. Dépendance `socket.io` inutile côté frontend
- **Où** : `frontend/package.json`.
- **Problème** : `socket.io` (librairie serveur) est listé dans les dépendances du frontend. Seul `socket.io-client` est utilisé.
- **Piste** : retirer `socket.io`.

### 🟡 17. Outils de build dans `dependencies`
- **Où** : `frontend/package.json`.
- **Problème** : `@vitejs/plugin-react` et `vite` sont en `dependencies` alors qu'ils servent au build et au dev.
- **Piste** : les déplacer dans `devDependencies`.

### 🟡 18. Logique de règles dupliquée côté client
- **Où** : `frontend/src/components/Game.tsx`
  - `isSelectedCardValid` reprend les règles du moteur (joker, valeur minimale de la pile).
  - `getCardFromId` reconstruit les cartes alors que `yourCard` les fournit déjà (valeur, nom, asset).
- **Problème** : deux sources de vérité pour les règles. Le serveur doit rester la seule.
- **Piste** : garder seulement une validation d'affichage, ou la supprimer et s'appuyer sur les erreurs `gameError`. (l'idée de doubler et d'avoir un rendu direct si on essaye de jouer un coup "illégal")

### 🟡 19. Configuration Firebase en double
- **Où** : `frontend/src/firebase.tsx` et `frontend/src/firebase-app.ts`.
- **Problème** : les deux modules appellent `initializeApp` avec la même config codée en dur.
- **Piste** : un seul module, config lue depuis des variables `VITE_FIREBASE_*`.

### 🟡 20. `console.log` et appels dans le rendu
- **Où** : 50 occurrences dans `frontend/src`. `frontend/src/pages/Profile.tsx` fait `console.log(auth)` et `getAuth()` directement dans le corps du composant (exécuté à chaque rendu).
- **Piste** : supprimer les logs de debug, sortir `getAuth()` du rendu.

### 🟡 21. `Game.tsx` trop gros
- **Où** : `frontend/src/components/Game.tsx` (545 lignes).
- **Problème** : mélange gestion du socket, rendu et règles.
- **Piste** : découper (hook `useGameSocket`, composant de main, logique de sélection). Refactor plus large, à planifier.

### 🟡 22. Images lourdes et doublons
- **Où** : `frontend/public/mc.jpg` (2,5 Mo), `frontend/public/mc.jpeg` (112 Ko), `frontend/public/default.jpeg` (112 Ko).
- **Problème** : `mc.jpg` et `mc.jpeg` sont en double, et `mc.jpg` est très lourd.
- **Piste** : garder une seule version, la compresser (WebP ou JPEG redimensionné).

### 🟡 23. Raccourcis clavier globaux
- **Où** : `frontend/src/components/home/Actions.tsx` (écoute `&` et `é` sur `window`) ; `frontend/src/components/Game.tsx` (écoute `Enter`).
- **Problème** : ces touches peuvent se déclencher pendant la saisie dans un autre champ.
- **Piste** : ignorer les événements dont la cible est un `input`, `textarea` ou élément `contenteditable`.

### 🟡 24. Transport Socket.IO limité au WebSocket
- **Où** : `frontend/src/components/Game.tsx`, `io(SOCKET_URL, { transports: ["websocket"] })`.
- **Problème** : pas de repli en polling si le WebSocket est bloqué (certains proxys, réseaux d'entreprise).
- **Piste** : retirer `transports` pour garder la valeur par défaut, ou ajouter `polling` en repli.
