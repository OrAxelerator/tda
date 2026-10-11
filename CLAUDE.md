# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Tour de l'As" (TDA): an online multiplayer card game (2–6 players, real time) written in French. Rules are in `regle.md`, the spec in `cdc.md`, the intended architecture in `architecture.md`. Code comments, UI text and most docs are in French; keep new user-facing text consistent with that.

Two independent npm packages, no root package.json:
- `frontend/`: React 19 + TypeScript + Vite, react-router, Firebase client SDK (Auth + Firestore), socket.io-client.
- `backend/`: Express 5 + Socket.IO server, Firebase Admin SDK, TypeScript run directly with `tsx` (CommonJS).

## Commands

Backend (serves on port 3000):
```
cd backend
npm run dev      # tsx watch src/index.ts
npm start        # tsx src/index.ts
```
Locally the backend needs `backend/env/env` containing a line `FIREBASE_SERVICE_ACCOUNT={...json...}` (loaded by `src/firebase.ts`). On Render, `RENDER=true` and `FIREBASE_SERVICE_ACCOUNT` come from the environment instead.

Frontend (Vite on port 5173):
```
cd frontend
npm run dev      # vite; proxies /api, /rooms, /socket.io to localhost:3000
npm run build    # vite build (does NOT run tsc)
npm run lint     # eslint .
npm run preview
```

There is no test suite and no backend lint or typecheck script. `backend/tsconfig.json` and `frontend/tsconfig.app.json` exist, but nothing runs them automatically.

## Architecture

**Authority lives on the server.** The client sends intents; the server validates them with the game engine and broadcasts the result. `architecture.md` states this as the principle. The client must not modify game state directly.

**Realtime flow.** A game involves both HTTP and Socket.IO:
- REST (`backend/src/index.ts`): `POST /api/createGame` (needs a Firebase ID token as `Authorization: Bearer`), `POST /rooms/:roomId/joinGame`, `POST /rooms/:roomId/startGame`, `POST /rooms/:roomId/leave`.
- Socket.IO events: `joinRoom` (joins the socket to a room and registers the player), `playCard` (`{roomId, userId, cardIds}`), `takePile`. The server answers with `gameUpdate` (a per-socket payload with that player's `yourCard`) or `gameError`.
- The frontend's `Game.tsx` owns the socket. `config.ts` picks the base URL: in dev it uses `localhost:3000` directly, in production it uses `VITE_API_URL`.

**Game engine (`backend/src/game/`).** `GameEngine.ts` holds all rule logic (`playCards`, `takePile`, `nextTurn`, `startGame`, `playBotTurn`, add/remove player). `GameState`, `Deck`, `Player` and `Card` are plain data. The engine is meant to be independent of Express, Socket.IO and Firebase. Keep it that way: rule changes belong in the engine, not in the route handlers.

**In-memory game state.** Each room's engine is kept in the `roomEngines` Map, keyed by the Firestore `rooms` document ID. The Map is lost on server restart. `getEngineForRoom` also falls back to module-level `engine` / `currentRoomId` singletons, which is legacy behavior. Persisting state to Firestore is commented out (`updateRoomState` is a no-op). Real-time updates come from Socket.IO, not Firestore.

**Firebase split.**
- Backend Admin SDK: verifies ID tokens, creates `rooms` docs (`hostUid`, timestamps), and on game finish increments `gamesPlayed` / `gamesWon` on `user/{uid}` docs (`incrementFinishedGameStats`).
- Frontend client SDK: Auth (email/password, Google), reads and edits profiles in the `user` collection (`src/pages/Profile.tsx`, `src/utils/userProfile.ts`).

**Cards.** The deck is `backend/public/cards.json` (read from disk at `startGame`). Each card's `asset` is a filename under `frontend/public/cards/`, for example `01_theme1.png`.

## Gotchas

- `gameUpdate` sends `state: serializeState(state)`, which includes every player's full hand. The `// everything, bad` comment in the code acknowledges this. Hidden hands are not actually hidden from clients yet, so don't rely on them being private.
- The disconnect handler closes a room when it is in `playing` phase and at most one player remains. The room's `roomEngines` entry is deleted.
- `architecture.md` describes Cloud Functions and Firestore as the source of truth. That is the target design, not the current code. Check the code before assuming the Firestore path works.
- Env file handling is inconsistent: `index.ts` calls `dotenv` on `env/.env`, while `firebase.ts` reads `env/env`. The Firebase setup depends on `env/env`.
- The backend `public/` folder is served statically by Express (`express.static`), and `cards.json` is read from it.
- `frontend/src/firebase.tsx` and `frontend/src/firebase-app.ts` both call `initializeApp` with the same config. Pick one when touching Firebase setup.
- `docs/setup.md` says `npm run dev backend` for the backend, which is wrong. Use `npm run dev` inside `backend/`.
