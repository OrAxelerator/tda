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

import { createServer } from "http";
import { Server } from "socket.io";

const isRender = process.env.RENDER === "true";

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
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
  }),
);

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

let engine: GameEngine | null = null;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  // seulement 1 instance
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

const roomEngines = new Map<string, GameEngine>();
const socketRooms = new Map<string, string>();
const connectedPlayersByRoom = new Map<
  string,
  Map<string, { id: string; name: string; socketId: string }>
>();
let currentRoomId: string | null = null;
let availableCards: EngineCard[] = [];

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
      const playerId =
        typeof payload === "string" ? undefined : payload.playerId;
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

  socket.on("playCard",async ({ roomId, userId, cardId, cardIds }) => {
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

  socket.on("takePile", async ({ roomId, userId }) => {
    const engine = getEngineForRoom(roomId);

    if (!engine || !roomId || !userId) {
      // ici a continier
      socket.emit("gameError", { message: "Action playCard invalide" });
      return;
    }

    try {
      engine.takePile(userId);
      
      engine.state.players.forEach((player) => {
        engine.refullPlayer(player.id);
      });
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
      engine = getEngineForRoom(roomId);
      if (!engine) {
        throw new Error("Not found gameEngine in socket:disconect");
      }
      console.log("FIND ENGINE");
      if (engine.state.phase == "playing") {
        if (engine.state.players.length <= 1) {
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

function createGameUpdatePayload(
  roomId: string,
  game: GameEngine,
  playerId?: string,
) {
  const state = game.getState();
  const currentPlayer = playerId ? game.getPlayer(playerId) : undefined;

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
        isWinner: player.isWinner
      })),
    yourCard: currentPlayer?.hand.map(serializeCard) ?? [],
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

  const sockets = io.sockets.adapter.rooms.get(roomId);

  if (!sockets || sockets.size === 0) {
    io.to(roomId).emit("gameUpdate", createGameUpdatePayload(roomId, game));
    return;
  }

  for (const socketId of sockets) {
    const connectedPlayer = connectedPlayersByRoom.get(roomId)?.get(socketId);
    io.to(socketId).emit(
      "gameUpdate",
      createGameUpdatePayload(roomId, game, connectedPlayer?.id),
    );
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
    console.warn(
      "No roomId provided, returning current engine [getEngineForRoom]",
    );
    return engine;
  }

  if (roomEngines.has(roomId)) {
    console.log(`Returning engine for roomId ${roomId} [getEngineForRoom]`);
    return roomEngines.get(roomId) ?? null;
  }

  if (roomId === currentRoomId) {
    return engine;
  }
  console.warn(`No engine found for roomId ${roomId} [getEngineForRoom]`);
  console.log(roomEngines);
  return null;
}


app.post("/api/createGame", async (req, res) => {
  console.log("");
  console.log("----------- CREATE GAME ---------------");
  console.log("-1");
  if (!admin.apps.length) {
    return res
      .status(500)
      .json({ success: false, message: "Firebase admin not initialized" });
  }
  console.log("0");
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
    console.log("avant");
    const decoded = await admin.auth().verifyIdToken(idToken); 
    console.log("apres");
    const uid = decoded.uid;
    const numberBot = Number(req.body.bots);
    console.log("int bots : ");
    console.log(numberBot);

    // create a new room doc in Firestore
    const db = admin.firestore();
    const roomRef = await db.collection("rooms").add({
      hostUid: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      state: null,
    });
    
    const snapshot = await db.collection("user").doc(uid).get();
    let name = "HOST";

    if (snapshot.exists) {
        name = snapshot.data()?.displayName ?? "HOST";
    }
    console.log("1");
    console.log('Name : ', name);

    // initialize engine and persist initial state
    const roomDeck = availableCards.map((card) => ({ ...card }));
    const state = new GameState(new Deck(roomDeck), roomRef.id);
    // state.players.push(...players);
    state.players.push(new Player(uid, name, true, false, false)); // Add the host player to the game
    // marche pas ????
    
    console.log("--- bots -----");
    console.log(numberBot);
    for (let i = 0; i < numberBot; i++) {
      console.log("1 add bot");
      const botId = randomUUID();
      state.players.push(new Player(botId, "bot", false, false, true)); // Add the BOTS player to the game
    }
    console.log("--- bots -----");
    console.log("state.players : ", state.players);

    state.phase = "waiting";
    console.log("2");
    const roomEngine = new GameEngine(state, roomDeck);
    console.log("roomEngine : ", roomEngine);
    console.log("roomRef.id : ", roomRef.id);
    roomEngines.set(roomRef.id, roomEngine);
    currentRoomId = roomRef.id;
    console.log("4");
    await db
      .collection("rooms")
      .doc(roomRef.id)
      .update({
        state: serializeState(state),
      });

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

  console.log("---------- END Create Game --");
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
  const { playerId, playerName } = req.body as {
    playerId: string;
    playerName: string;
  };
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

  if (!roomId || !playerId || !playerName) {
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
    console.log("---------------");
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

  const game = getEngineForRoom(roomId);
  if (!game) {
    return res.status(404).json({ success: false, message: "Game not found" });
  }

  try {
    const cardsPath = path.join(process.cwd(), "public", "cards.json");
    const raw = await readFile(cardsPath, "utf8");
    const cards = JSON.parse(raw) as EngineCard[];
    const cardsCopy = cards.map((card) => ({ ...card }));
    availableCards = cardsCopy.map((card) => ({ ...card }));
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
  const { playerId } = req.body;
  console.log("");
  console.log("--------------------");
  console.log(`Player ${playerId} want to leave ${roomId}`);
  const engine = getEngineForRoom(roomId);

  if (!engine) {
    return res.status(404).json({ success: false, message: "Game not found" });
  }

  engine.removePlayer(playerId);
  console.log("Player successfully left !!");

  await updateRoomState(roomId, engine.state);
  emitGameUpdate(roomId);

  console.log("--------------------");
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
async function bootstrap() {
  httpServer.listen(PORT, () => {
    console.log("Backend lancé sur http://localhost:3000");
  });
}

bootstrap();
