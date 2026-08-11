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

import { createServer } from "http";
import { Server } from "socket.io";


const app = express();

// charger les variables d'environnement depuis /env/.env (le fichier n'est pas lu par moi)
dotenv.config({ path: path.join(process.cwd(), "env", ".env") });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));


let engine: GameEngine | null = null;

const httpServer = createServer(app);
const io = new Server(httpServer, { // seulement 1 instance
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const roomEngines = new Map<string, GameEngine>();
const socketRooms = new Map<string, string>();
const connectedPlayersByRoom = new Map<string, Map<string, { id: string; name: string; socketId: string }>>();
let currentRoomId: string | null = null;
let availableCards: EngineCard[] = [];


// --------

// io.on("connection", (socket) => {
//   console.log("Socket connecté :", socket.id);

//   socket.on("joinRoom", (roomId: string) => {
//     socket.join(roomId);

//     console.log(`${socket.id} rejoint ${roomId}`);
//   });

//   socket.on("disconnect", () => {
//     console.log("Socket déconnecté :", socket.id);
//   });
// });

io.on("connection", (socket) => {
  console.log("Socket connecté :", socket.id);

  socket.on("joinRoom", (payload: string | { roomId: string; playerId?: string; playerName?: string }) => {
    const roomId = typeof payload === "string" ? payload : payload.roomId;
    const playerId = typeof payload === "string" ? undefined : payload.playerId;
    const playerName = typeof payload === "string" ? undefined : payload.playerName;

    if (!roomId) {
      socket.emit("gameError", { message: "roomId manquant" });
      return;
    }

    socket.join(roomId);
    socketRooms.set(socket.id, roomId);
    setConnectedPlayer(roomId, socket.id, playerId, playerName);
    emitGameUpdate(roomId);
  });

  socket.on("playCard", ({ roomId, userId, cardId, cardIds }) => {
    const engine = getEngineForRoom(roomId);
    const cards = Array.isArray(cardIds)
      ? cardIds
      : Array.isArray(cardId)
        ? cardId
        : [cardId];

    if (!engine || !roomId || !userId || cards.some((card) => typeof card !== "number")) {
      socket.emit("gameError", { message: "Action playCard invalide" });
      return;
    }

    try {
      engine.playCards(userId, cards);
      emitGameUpdate(roomId);
    } catch (error: any) {
      console.warn("Coup refusé par GameEngine:", {
        roomId,
        userId,
        cards,
        message: error.message,
      });
      socket.emit("gameError", { message: error.message || "Impossible de jouer cette carte" });
    }
  });

  socket.on("takePile", ({roomId, userId}) => {
    const engine = getEngineForRoom(roomId);

    if (!engine || !roomId || !userId ) { // ici a continier
      socket.emit("gameError", { message: "Action playCard invalide" });
      return;
    }

    try {
      engine.takePile(userId)
      // pas mettre next turn ici plutot ?
      engine.state.players.forEach(player => {
        engine.refullPlayer(player.id)
      });
      emitGameUpdate(roomId);
    }
    catch (error:any) {
    console.warn("Coup refusé par GameEngine:", {
        roomId,
        userId,
        message: error.message,
      });
      socket.emit("gameError", { message: error.message || "Problème avec la discardPile" });  
    }
  })

  socket.on("disconnect", () => {
    const roomId = socketRooms.get(socket.id);
    if (roomId) {
      removeConnectedPlayer(roomId, socket.id);
      socketRooms.delete(socket.id);
      emitGameUpdate(roomId);
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
    players: state.players.map(serializePlayer),
    deck: {
      cards: state.deck.cards.map(serializeCard),
    },
    discardPile: state.discardPile,
    currentPlayerId: state.currentPlayerId,
    turn: state.turn,
    phase: state.phase,
  };
}

function getConnectedPlayers(roomId: string) {
  return Array.from(connectedPlayersByRoom.get(roomId)?.values() ?? []).map((player) => ({
    id: player.id,
    name: player.name,
  }));
}

function setConnectedPlayer(roomId: string, socketId: string, playerId?: string, playerName?: string) {
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

function createGameUpdatePayload(roomId: string, game: GameEngine, playerId?: string) {
  const state = game.getState();
  const currentPlayer = playerId ? game.getPlayer(playerId) : undefined;

  return {
    roomId,
    discardCard: state.discardPile,
    deckLength: state.deck.cards.length,
    otherPlayers: state.players
      .filter((player) => player.id !== playerId)
      .map((player) => ({
        id: player.id,
        name: player.name,
        isHost: player.isHost,
        cardCount: player.hand.length,
      })),
    yourCard: currentPlayer?.hand.map(serializeCard) ?? [],
    numberOfTurn: state.turn,
    currentPlayerId: state.currentPlayerId,
    phase: state.phase,
    connectedPlayers: getConnectedPlayers(roomId),
    state: serializeState(state),
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
    io.to(socketId).emit("gameUpdate", createGameUpdatePayload(roomId, game, connectedPlayer?.id));
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
    console.warn("No roomId provided, returning current engine [getEngineForRoom]");
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

async function start() {
  try {
    // Cette fonction n'est pas utilisée actuellement.
    // Si nécessaire, réactiver la lecture et l'initialisation des cartes ici.
  } catch (error) {
    console.error("Failed to initialize game starter", error);
  }
}



app.post("/api/createGame", async (req, res) => {
  console.log("");
  console.log("----------- CREATE GAME ---------------");
  if (!admin.apps.length) {
    return res.status(500).json({ success: false, message: "Firebase admin not initialized" });
  }

  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // create a new room doc in Firestore
    const db = admin.firestore();
    const roomRef = await db.collection("rooms").add({
      hostUid: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      state: null,
    });

    // initialize engine and persist initial state
    const roomDeck = availableCards.map((card) => ({ ...card }));
    const state = new GameState(new Deck(roomDeck), roomRef.id);
    // state.players.push(...players);
    state.players.push(new Player(uid, "Host", true)); // Add the host player to the game
    // marche pas ????
    console.log("state.players : ", state.players);

    state.phase = "waiting";

    const roomEngine = new GameEngine(state, roomDeck);
    console.log("roomEngine : ", roomEngine);
    console.log("roomRef.id : ", roomRef.id);
    roomEngines.set(roomRef.id, roomEngine);
    currentRoomId = roomRef.id;

    await db.collection("rooms").doc(roomRef.id).update({
      state: serializeState(state),
    });

    res.json({ success: true, roomId: roomRef.id });
  } catch (err: any) {
    console.error("createGame error:", err);
    res.status(400).json({ success: false, message: err.message || "Failed to create room" });
  }

  console.log("---------- END Create Game --");
});


app.get("/api/firebaseConfig", (req, res) => {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  };

  if (!config.apiKey || !config.projectId) {
    return res.status(500).json({ success: false, message: "Missing Firebase client config in environment" });
  }

  res.json({ success: true, config });
});


app.get("/rooms/:roomId/state", (req, res) => {
  console.log("-----------------------");
  console.log("get state request received");
  const { roomId } = req.params;
  console.log("roomId : ", roomId);
  const engine = getEngineForRoom(roomId as string | undefined);
  console.log("engine : ", engine);

  if (!engine) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }

  res.json({ success: true, state: engine.getState() });
});




app.get("/players", (req, res) => { // get list of player
  const engine = getEngineForRoom(req.query.roomId as string | undefined);

  if (!engine) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }
  console.log("");
  console.log("Return List of player in app.get(/players) ");
  console.log("");
  res.json({ success: true, players: engine.getPlayers() });
});


app.get("/rooms/:roomId/phase", (req, res) => { // get phase of the game
  console.log("")
  console.log("phase -----------------")
  
   const { roomId } = req.params;
   console.log("get roomId = ", roomId)

  const engine = getEngineForRoom(roomId);
  
  if (!engine) {
    console.log("⚠️ Error gameEngine NOT READY ? ");
    console.log(engine);
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }
  console.log("Returning phase of game", engine?.getPhase)
  console.log("phase -----------------")
    
  res.json({ success: true, phase: engine?.getPhase() });
});




app.get("/players/:playerId/cards", (req, res) => {
const roomId = req.query.roomId as string | undefined;
  console.log("--------------------------- GET CARD PLAYER 1 ---------------------------");
  console.log("roomId : ", roomId);
  if (!roomId) {
    return res.status(400).json({ success: false, message: "Missing required parameters" });
  }

  const game = getEngineForRoom(roomId);
  if (!game) {
    return res.status(404).json({ success: false, message: "Game not found" });
  }
  // if (!engine) {
  //   return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  // }
  console.log("try fetch caard");
  const { playerId } = req.params;
  res.json({ success: true, cards: game.getPlayerCards(playerId) });
});


app.get("/discard-pile", (req, res) => {
  const roomId = req.query.roomId as string | undefined;
  const game = getEngineForRoom(roomId);

  if (!game) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }

  res.json({ success: true, discardPile: game.getDiscardPile() });
});

app.post("/play", async (req, res) => {
  const roomId = (req.body as any).roomId as string | undefined;
  const game = getEngineForRoom(roomId);

  if (!game) {
    return res.status(500).json({
      success: false,
      message: "Game engine is not ready yet",
    });
  }

  try {
    const { playerId, cards } = req.body as {
      playerId: string;
      cards: number[];
      roomId?: string;
    };
    console.log("player ", playerId, "joue");
    console.log("ses cartes : ", cards);

    game.playCards(playerId, cards);

    const roomIdToUpdate = roomId ?? currentRoomId;
    if (roomIdToUpdate) {
      await updateRoomState(roomIdToUpdate, game.state);
      emitGameUpdate(roomIdToUpdate);
    }

    res.json({
      success: true,
      state: game.state,
    });
    console.log("carte joué");

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});


app.post("/game/play", async (req, res) => {
  console.log("to DELETE N???????????????????????????????????????????????????????????????");
  const roomId = (req.body as any).roomId as string | undefined;
  const game = getEngineForRoom(roomId);

  if (!game) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }

  const { playerId, cardId } = req.body as {
    playerId: string;
    cardId: number;
    roomId?: string;
  };

  try {
    game.playCard(playerId, cardId);

    const roomIdToUpdate = roomId ?? currentRoomId;
    if (roomIdToUpdate) {
      await updateRoomState(roomIdToUpdate, game.state);
      emitGameUpdate(roomIdToUpdate);
    }

    res.json({ success: true, state: game.getStateForFrontend() });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post("/rooms/:roomId/joinGame", async (req, res) => {
  const { roomId } = req.params;
  const { playerId, playerName } = req.body as {
    playerId: string;
    playerName: string;
  };
  console.log("");
  console.log("------------------------------------------")
  console.log("joinGame request received for roomId:", roomId, "playerId:", playerId, "playerName:", playerName);

  if ( !roomId || !playerId || !playerName) {
    return res.status(400).json({ success: false, message: "Missing required parameters" });
  }
  const game = getEngineForRoom(roomId);
  if (!game) {
    return res.status(404).json({ success: false, message: "Game not found" });
  }

  const existingPlayer = game.getPlayer(playerId);
  console.log("existingPlayer : ", existingPlayer);
  const playersList = game.getPlayers();
  if (playersList.length >= 6) {
    return res.status(400).json({ success: false, message: "The Room is full" });
  }

  if (!existingPlayer) {
    const newPlayer = new Player(playerId, playerName, false);
    game.addPlayer(newPlayer);
    
    // io.to(roomId).emit("gameState", game.state); // send INFO of room to all players in the room

    console.log("player ajouté : ", newPlayer);

    await updateRoomState(roomId, game.state);
    emitGameUpdate(roomId);
    console.log("---------------");
    return res.json({ success: true, state: game.getStateForFrontend() });
  } else {
    return res.status(400).json({ success: false, message: "Player already exists in the room" });
  }



});


app.post("/rooms/:roomId/startGame", async (req, res) => {
  console.log("--------------------------- START GAME ---------------------------");
  const { roomId } = req.params;
  console.log("roomId : ", roomId);
  if (!roomId) {
    return res.status(400).json({ success: false, message: "Missing required parameters" });
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


    game.startGame();
    game.state.phase = "playing";
    // game.nextTurn() // debug cause player 1 don't connect
    await updateRoomState(roomId, game.state);
    emitGameUpdate(roomId);

    console.log("End start game ----------------");

    return res.json({ success: true, state: game.getStateForFrontend() });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
})

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


async function bootstrap() {
  httpServer.listen(3000, () => {
    console.log("Backend lancé sur http://localhost:3000");
  });
}

bootstrap();
