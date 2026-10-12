import express from "express";
import cors from "cors";
import path from "node:path";
import dotenv from "dotenv";
import { readFile } from "node:fs/promises";

import { GameEngine } from "./game/GameEngine";
import { GameState } from "./game/GameState";
import { Player } from "./game/Player";
import { Deck } from "./game/Deck";
import { Card } from "./game/Card";
import type { Card as EngineCard } from "./game/Card";
import admin from "./firebase";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { randomUUID } from "crypto";
import { MAX_BOTS, parseBotCount } from "./validation";

import { createServer } from "http";
import { Server } from "socket.io";
import firebase from "./firebase";

import { handleAchievementEvent } from "./achievements/achievementService";

const isRender = process.env.RENDER === "true";
const db = firebase.firestore()
const app = express();

// charger les variables d'environnement depuis /env/.env
if (!isRender) {
  // Local : charger les variables depuis /env/.env
  dotenv.config({
    path: path.join(process.cwd(), "env", ".env"),
  });
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: allowedOrigins,
  }),
);

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));


const httpServer = createServer(app);
const io = new Server(httpServer, {
  // seulement 1 instance
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// Authentification Socket.IO : l'identité vient du token Firebase, jamais du payload
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token || typeof token !== "string") {
    return next(new Error("Token manquant"));
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    socket.data.uid = decoded.uid;
    next();
  } catch {
    next(new Error("Token invalide"));
  }
});

// Identité REST : renvoie l'uid du token Bearer, ou null si absent / invalide
async function getUidFromRequest(req: express.Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.split(" ")[1]);
    return decoded.uid;
  } catch {
    return null;
  }
}

const roomEngines = new Map<string, GameEngine>();
const socketRooms = new Map<string, string>();
const connectedPlayersByRoom = new Map<
  string,
  Map<string, { id: string; name: string; socketId: string }>
>();
let availableCards: EngineCard[] = [];

async function incrementFinishedGameStats(roomId: string) {
  const game = getEngineForRoom(roomId);

  if (!game || game.state.phase !== "finished") {
    return;
  }

  const players = game.state.players.filter((player) => !player.isBot);
  const winnerIds = new Set(
    game.state.players.filter((player) => player.isWinner).map((player) => player.id),
  );


  
  await Promise.all(
    players.map(async (player) => {
      const playerRef = admin.firestore().collection("users").doc(player.id);

      await playerRef.update({
        gamesPlayed: admin.firestore.FieldValue.increment(1),
        ...(winnerIds.has(player.id)
          ? { gamesWon: admin.firestore.FieldValue.increment(1) }
          : {}),
      });

      if (winnerIds.has(player.id)) {
        await handleAchievementEvent({ type: "GAME_WON", userId: player.id });
      }
    }),
  );
}

io.on("connection", (socket) => {
  console.log("Socket connecté :", socket.id);

  socket.on(
    "joinRoom",
    (
      payload:
        | string
        | { roomId: string; playerId?: string; playerName?: string },
    ) => {
      const roomId = typeof payload === "string" ? payload : payload.roomId;
      // playerId du payload ignoré : l'identité est celle du token
      const playerId: string = socket.data.uid;
      const playerName =
        typeof payload === "string" ? undefined : payload.playerName;

      if (!roomId) {
        socket.emit("gameError", { message: "roomId manquant" });
        return;
      }

      socket.join(roomId);
      socketRooms.set(socket.id, roomId);
      setConnectedPlayer(roomId, socket.id, playerId, playerName);
      emitGameUpdate(roomId);
    },
  );

  socket.on("playCard",async ({ roomId, cardId, cardIds }) => {
    const userId: string = socket.data.uid;
    const engine = getEngineForRoom(roomId);
    const cards = Array.isArray(cardIds)
      ? cardIds
      : Array.isArray(cardId)
        ? cardId
        : [cardId];

    if (
      !engine ||
      !roomId ||
      !userId ||
      cards.some((card) => typeof card !== "number")
    ) {
      socket.emit("gameError", { message: "Action playCard invalide" });
      return;
    }

    try {
      await engine.playCards(userId, cards);

      if (engine.state.phase === "finished") {
        await incrementFinishedGameStats(roomId);
      }

      emitGameUpdate(roomId);

    } catch (error: any) {
      console.warn("Coup refusé par GameEngine:", {
        roomId,
        userId,
        cards,
        message: error.message,
      });
      socket.emit("gameError", {
        message: error.message || "Impossible de jouer cette carte",
      });
    }
  });

  socket.on("takePile", async ({ roomId }) => {
    const userId: string = socket.data.uid;
    const engine = getEngineForRoom(roomId);

    if (!engine || !roomId || !userId) {
      // ici a continier
      socket.emit("gameError", { message: "Action playCard invalide" });
      return;
    }

    try {
      await engine.takePile(userId);
      await engine.nextTurn();
      emitGameUpdate(roomId);
    } catch (error: any) {
      console.warn("Coup refusé par GameEngine:", {
        roomId,
        userId,
        message: error.message,
      });
      socket.emit("gameError", {
        message: error.message || "Problème avec la discardPile",
      });
    }
  });

  socket.on("disconnect", () => {
    const roomId = socketRooms.get(socket.id);
    if (roomId) {
      removeConnectedPlayer(roomId, socket.id);
      socketRooms.delete(socket.id);
      console.log("PLAYER LEFT");
      const disconnectedRoomEngine = getEngineForRoom(roomId);
      if (!disconnectedRoomEngine) {
        console.warn(`No game engine found while disconnecting room ${roomId}`);
        return;
      }
      console.log("FIND ENGINE");
      if (disconnectedRoomEngine.state.phase == "playing") {
        if (disconnectedRoomEngine.state.players.length <= 1) {
          console.log("NOT ENOUGH PLAYER");
          roomEngines.delete(roomId);

          // Supprimer les sockets associés à cette room
          for (const [socketId, socketRoomId] of socketRooms) {
            if (socketRoomId === roomId) {
              socketRooms.delete(socketId);
            }
          }

          // Faire quitter la room Socket.io
          io.in(roomId).socketsLeave(roomId);

          console.log(`GAME ${roomId} CLOSED`);
          console.log("CIOAAAAAAAAAA");
        } else {
          emitGameUpdate(roomId);
        }
      }
    }
  });
});

function serializeCard(card: Card) {
  return {
    id: card.id,
    suit: card.suit,
    value: card.value,
    name: card.name,
    asset: card.asset,
  };
}

function serializePlayer(player: Player) {
  return {
    id: player.id,
    name: player.name,
    isHost: player.isHost,
    hand: player.hand.map(serializeCard),
  };
}

function serializeState(state: GameState) {
  return {
    players: state.players.map(serializePlayer), // here there are all player info ?
    deck: {
      cards: state.deck.cards.map(serializeCard),
    },
    discardPile: state.discardPile,
    currentPlayerId: state.currentPlayerId,
    turn: state.turn,
    phase: state.phase, // everything, bad ...
  };
}

function getConnectedPlayers(roomId: string) {
  return Array.from(connectedPlayersByRoom.get(roomId)?.values() ?? []).map(
    (player) => ({
      id: player.id,
      name: player.name,
    }),
  );
}

function setConnectedPlayer(
  roomId: string,
  socketId: string,
  playerId?: string,
  playerName?: string,
) {
  if (!playerId) {
    return;
  }

  const engine = getEngineForRoom(roomId);
  const player = engine?.getPlayer(playerId);
  const connectedPlayers = connectedPlayersByRoom.get(roomId) ?? new Map();

  connectedPlayers.set(socketId, {
    id: playerId,
    name: playerName || player?.name || "Joueur",
    socketId,
  });
  connectedPlayersByRoom.set(roomId, connectedPlayers);
}

function removeConnectedPlayer(roomId: string, socketId: string) {
  const connectedPlayers = connectedPlayersByRoom.get(roomId);
  if (!connectedPlayers) {
    return;
  }

  connectedPlayers.delete(socketId);
  if (connectedPlayers.size === 0) {
    connectedPlayersByRoom.delete(roomId);
  }
}

// Supprime la room côté serveur : moteur, joueurs connectés et sockets associés
function deleteRoom(roomId: string) {
  roomEngines.delete(roomId);
  connectedPlayersByRoom.delete(roomId);

  for (const [socketId, socketRoomId] of socketRooms) {
    if (socketRoomId === roomId) {
      socketRooms.delete(socketId);
    }
  }
}

// Partie commune à tous les joueurs (calculée une seule fois par emitGameUpdate)
function createGameUpdatePayload(roomId: string, game: GameEngine) {
  const state = game.getState();

  return {
    roomId,
    discardCard: state.discardPile,
    deckLength: state.deck.cards.length,
    publicPlayer: state.players
      .map((player) => ({
        id: player.id,
        name: player.name,
        isHost: player.isHost,
        // cardCount: player.hand.length,
        cardCount: state.phase != "playing" ? null : player.hand.length,
        isWinner: player.isWinner,
        isBot: player.isBot
      })),
    numberOfTurn: state.phase != "playing" ? null : state.turn,
    currentPlayerId: state.currentPlayerId,
    phase: state.phase,
    state: serializeState(state), // also delete this
  };
}

function emitGameUpdate(roomId: string) {
  const game = getEngineForRoom(roomId);
  if (!roomId || !game) {
    return;
  }

  // Partie commune : calculée une seule fois pour toute la room
  const basePayload = createGameUpdatePayload(roomId, game);

  const sockets = io.sockets.adapter.rooms.get(roomId);

  if (!sockets || sockets.size === 0) {
    io.to(roomId).emit("gameUpdate", { ...basePayload, yourCard: [] });
    return;
  }

  // Seule la main change d'un socket à l'autre
  for (const socketId of sockets) {
    const connectedPlayer = connectedPlayersByRoom.get(roomId)?.get(socketId);
    const hand =
      game.getPlayer(connectedPlayer?.id ?? "")?.hand.map(serializeCard) ?? [];
    io.to(socketId).emit("gameUpdate", { ...basePayload, yourCard: hand });
  }
}

async function updateRoomState(roomId: string, state: GameState) {
  // Firebase désactivé pour le state temps réel : Socket.IO porte les updates.
  // const db = admin.firestore();
  // await db.collection("rooms").doc(roomId).update({
  //   state: serializeState(state),
  //   updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  // });
}

function getEngineForRoom(roomId: string | undefined) {
  if (!roomId) {
    console.warn("No roomId provided [getEngineForRoom]");
    return null;
  }

  if (roomEngines.has(roomId)) {
    console.log(`Returning engine for roomId ${roomId} [getEngineForRoom]`);
    return roomEngines.get(roomId) ?? null;
  }

  console.warn(`No engine found for roomId ${roomId} [getEngineForRoom]`);
  console.log(roomEngines);
  return null;
}

app.post("/api/createGame", async (req, res) => {
  console.log("");
  console.log("----------- CREATE GAME ---------------");
  
  if (!admin.apps.length) {
    return res
      .status(500)
      .json({ success: false, message: "Firebase admin not initialized" });
  }
  
  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Missing or invalid Authorization header",
      });
  }

  const idToken = authHeader.split(" ")[1];

  try {
  
    const decoded = await admin.auth().verifyIdToken(idToken); 
  
    const uid = decoded.uid;
    const numberBot = parseBotCount(req.body.bots);

    if (numberBot === null) {
      return res.status(400).json({
        success: false,
        message: `Nombre de bots invalide (entier de 0 à ${MAX_BOTS})`,
      });
    }


    // create a new room doc in Firestore
    const db = admin.firestore();
    const roomRef = await db.collection("rooms").add({
      hostUid: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      state: null,
    });
    
    const snapshot = await db.collection("users").doc(uid).get();
    let name = "HOST";

    if (snapshot.exists) {
        name = snapshot.data()?.displayName ?? "HOST";
    }
    console.log('Name : ', name);

    // initialize engine and persist initial state
    const roomDeck = availableCards.map((card) => ({ ...card }));
    const state = new GameState(new Deck(roomDeck), roomRef.id);
    // state.players.push(...players);
    state.players.push(new Player(uid, name, true, false, false)); // Add the host player to the game
    // marche pas ????
    if (numberBot > 0) {
      console.log("---------- bots ---------");
      console.log("Nombre de bots dans la game : ", numberBot);

      for (let i = 0; i < numberBot; i++) {
        console.log("1 add bot");
        const botId = randomUUID();
        state.players.push(new Player(botId, "bot", false, false, true)); // Add the BOTS player to the game
      }
      console.log("---------- bots ---------");
    }
    console.log("state.players.length : ", state.players.length);

    state.phase = "waiting";
    const roomEngine = new GameEngine(state, roomDeck);
    console.log("roomRef.id : ", roomRef.id);
    roomEngines.set(roomRef.id, roomEngine);
    // await db NOT FOR NOW ...
    //   .collection("rooms")
    //   .doc(roomRef.id)
    //   .update({
    //     state: serializeState(state),
    //   });

    res.json({ success: true, roomId: roomRef.id });
  } catch (err: any) {
    console.error("createGame error:", err);
    res
      .status(400)
      .json({
        success: false,
        message: err.message || "Failed to create room",
      });
  }

  console.log("---------- END CREATE GAME -------------");
  console.log("");
});

// app.get("/api/firebaseConfig", (req, res) => {
//   const config = {
//     apiKey: process.env.FIREBASE_API_KEY,
//     authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//     projectId: process.env.FIREBASE_PROJECT_ID,
//     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
//     appId: process.env.FIREBASE_APP_ID,
//     measurementId: process.env.FIREBASE_MEASUREMENT_ID,
//   };
//   if (!config.apiKey || !config.projectId) {
//     return res
//       .status(500)
//       .json({
//         success: false,
//         message: "Missing Firebase client config in environment",
//       });
//   }
//   res.json({ success: true, config });
// });


app.post("/rooms/:roomId/joinGame", async (req, res) => {
  const { roomId } = req.params;
  const { playerName } = req.body as { playerName: string };
  const playerId = await getUidFromRequest(req);
  if (!playerId) {
    return res
      .status(401)
      .json({ success: false, message: "Missing or invalid Authorization header" });
  }
  console.log("");
  console.log("------------------------------------------");
  console.log(
    "joinGame request received for roomId:",
    roomId,
    "playerId:",
    playerId,
    "playerName:",
    playerName,
  );

  if (!roomId || !playerName) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required parameters" });
  }
  const game = getEngineForRoom(roomId);
  if (!game) {
    return res.status(404).json({ success: false, message: "Game not found" });
  }

  const existingPlayer = game.getPlayer(playerId);
  console.log("existingPlayer : ", existingPlayer);
  const playersList = game.getPlayers();
  if (playersList.length >= 6) {
    return res
      .status(400)
      .json({ success: false, message: "The Room is full" });
  }

  if (!existingPlayer) {
    const newPlayer = new Player(playerId, playerName, false, false, false);
    game.addPlayer(newPlayer);

    // io.to(roomId).emit("gameState", game.state); // send INFO of room to all players in the room

    console.log("player ajouté : ", newPlayer);

    await updateRoomState(roomId, game.state);
    emitGameUpdate(roomId);
    console.log("---------------------------");
    return res.json({ success: true, state: game.getStateForFrontend() });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Player already exists in the room" });
  }
});

app.post("/rooms/:roomId/startGame", async (req, res) => {
  console.log(
    "--------------------------- START GAME ---------------------------",
  );
  const { roomId } = req.params;
  console.log("roomId : ", roomId);
  if (!roomId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required parameters" });
  }

  const uid = await getUidFromRequest(req);
  if (!uid) {
    return res
      .status(401)
      .json({ success: false, message: "Missing or invalid Authorization header" });
  }

  const game = getEngineForRoom(roomId);
  if (!game) {
    return res.status(404).json({ success: false, message: "Game not found" });
  }

  if (!game.getPlayer(uid)?.isHost) {
    return res
      .status(403)
      .json({ success: false, message: "Seul l'hôte peut lancer la partie" });
  }

  if (game.state.players.length <= 1 || game.state.players.length >= 7) {
    return res.status(400).json({ success: false, message: "Pas assez de joueur dans la partie" });
  }

  try {
    const cardsCopy = availableCards.map((card) => ({ ...card }));
    game.state.deck = new Deck(cardsCopy);
    game.setCards(cardsCopy);

    console.log("loaded cards : ", game.state.deck.cards.length);
    // const state = new GameState(new Deck(cardsCopy));

    game.state.phase = "playing"; // dd'abord pour gameUpdate est que user voit interface "playing"
    emitGameUpdate(roomId);
    await game.startGame();
    // game.nextTurn() // debug cause player 1 don't connect
    await updateRoomState(roomId, game.state);
    emitGameUpdate(roomId);

    console.log("End start game ----------------");

    return res.json({ success: true, state: game.getStateForFrontend() });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/rooms/:roomId/leave", async (req, res) => {
  const { roomId } = req.params;
  const playerId = await getUidFromRequest(req);
  if (!playerId) {
    return res
      .status(401)
      .json({ success: false, message: "Missing or invalid Authorization header" });
  }
  console.log("");
  console.log("--------------------");
  console.log(`👤 ==>🚪 - Player ${playerId} want to leave ${roomId}`);
  const engine = getEngineForRoom(roomId);

  if (!engine) {
    return res.status(404).json({ success: false, message: "Game not found" });
  }

  let replacementBot: Player | null = null;
  if (engine.state.phase === "playing") {
    // En pleine partie, un bot prend la place du joueur qui part
    replacementBot = engine.replaceWithBot(playerId);
  } else {
    engine.removePlayer(playerId);
  }
  console.log("👤 ==> ✅ - Player successfully left !!");

  // Plus aucun humain : la partie n'a plus de raison d'exister
  if (engine.state.players.every((player) => player.isBot)) {
    deleteRoom(roomId);
    console.log(`🗑️ Room ${roomId} supprimée : plus aucun joueur humain`);
    console.log("--------------------");
    return res.json({ success: true, deleted: true });
  }

  if (replacementBot && engine.state.currentPlayerId === replacementBot.id) {
    try {
      await engine.playBotTurn(replacementBot);
    } catch (error: any) {
      console.error("Tour du bot remplaçant en erreur:", error.message);
    }
  }

  await updateRoomState(roomId, engine.state);
  emitGameUpdate(roomId);

  console.log("--------------------");
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
async function loadCards(): Promise<EngineCard[]> {
  const cardsPath = path.join(process.cwd(), "public", "cards.json");
  const raw = await readFile(cardsPath, "utf8");
  return JSON.parse(raw) as EngineCard[];
}

async function bootstrap() {
  // Les cartes sont chargées avant d'écouter, pour qu'aucune room ne soit créée avec un deck vide
  availableCards = await loadCards();
  console.log("cards loaded at boot : ", availableCards.length);

  httpServer.listen(PORT, () => {
    console.log("Backend lancé sur http://localhost:3000");
  });
}

bootstrap();