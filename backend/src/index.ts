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
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const roomEngines = new Map<string, GameEngine>();
let currentRoomId: string | null = null;
let availableCards: EngineCard[] = [];


// --------

io.on("connection", (socket) => {
  console.log("Socket connecté :", socket.id);

  socket.on("joinRoom", (roomId: string) => {
    socket.join(roomId);

    console.log(`${socket.id} rejoint ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket déconnecté :", socket.id);
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

async function updateRoomState(roomId: string, state: GameState) {
  const db = admin.firestore();
  await db.collection("rooms").doc(roomId).update({
    state: serializeState(state),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
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
    // const cardsPath = path.join(process.cwd(), "public", "cards.json");
    // const raw = await readFile(cardsPath, "utf8");
    // const cards = JSON.parse(raw) as EngineCard[];
    // const cardsCopy = cards.map((card) => ({ ...card }));
    // availableCards = cardsCopy.map((card) => ({ ...card }));

    // const state = new GameState(new Deck(cardsCopy));

    // state.players.push(...players);

    state.deck.shuffle();

    engine = new GameEngine(state, cardsCopy);
    // engine.startGame();

    console.log(`Loaded ${cards.length} cards`);
  } catch (error) {
    console.error("Failed to load cards.json", error);
  }
}



app.post("/api/createGame", async (req, res) => {
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


app.get("/state", (req, res) => {
  console.log("-----------------------");
  console.log("get state request received");
  console.log("roomId : ", req.query.roomId);
  const engine = getEngineForRoom(req.query.roomId as string | undefined);
  console.log("engine : ", engine);

  if (!engine) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }

  res.json({ success: true, state: engine.getState() });
});




app.get("/players", (req, res) => { // get list of player
  const engine = getEngineForRoom(req.query.roomId as string | undefined);
  console.log("engine : ", engine);
  if (!engine) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }
    console.log("get player yees");
  res.json({ success: true, players: engine.getPlayers() });
});


app.get("/phase", (req, res) => { // get phase of the game
  console.log(req.query.roomId);
  const engine = getEngineForRoom(req.query.roomId as string | undefined);
  console.log("engine : ", engine);
  if (!engine) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }
    console.log("get phase yees");
    console.log("phase : ", engine?.getPhase());
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
  if (!engine) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }

  res.json({ success: true, discardPile: engine.getDiscardPile() });
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
    }

    res.json({ success: true, state: game.getStateForFrontend() });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post("/api/joinGame", async (req, res) => {
  console.log("-------------------------------------")
  console.log("joinGame request received");
  console.log("req.body : ", req.body);
  const { roomId, playerId, playerName } = req.body as {
    roomId: string;
    playerId: string;
    playerName: string;
  };

  if (!roomId || !playerId || !playerName) {
    return res.status(400).json({ success: false, message: "Missing required parameters" });
  }
  console.log("joinGame request received for roomId:", roomId, "playerId:", playerId, "playerName:", playerName);
  const game = getEngineForRoom(roomId);
  console.log("game : ", game);
  if (!game) {
    return res.status(404).json({ success: false, message: "Game not found" });
  }

  const existingPlayer = game.getPlayer(playerId);
  console.log("existingPlayer : ", existingPlayer);
  const playersList = game.getPlayers();
  if (playersList.length >= 4) {
    return res.status(400).json({ success: false, message: "The Room is full" });
  }

  if (!existingPlayer) {
    const newPlayer = new Player(playerId, playerName, false);
    game.addPlayer(newPlayer);
    
    
    io.to(roomId).emit("gameState", game.state); // send INFO of room to all players in the room



    console.log("player ajouté : ", newPlayer);
    console.log(game);

    await updateRoomState(roomId, game.state);

    return res.json({ success: true, state: game.getStateForFrontend() });
  } else {
    return res.status(400).json({ success: false, message: "Player already exists in the room" });
  }

});


app.post("/startGame", async (req, res) => {
  // const roomId = (req.body as any).roomId as string | undefined;
   const roomId = req.query.roomId as string | undefined;
  console.log("--------------------------- START GAME ---------------------------");
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

    console.log("loaded cards : ", game.state.deck.cards.length);
    // const state = new GameState(new Deck(cardsCopy));


    game.startGame();
    game.state.phase = "playing";
    game.state.deck.shuffle();
    await updateRoomState(roomId, game.state);
    io.to(roomId).emit("gameState", game.state); // send INFO of room to all players in the room
    return res.json({ success: true, state: game.getStateForFrontend() });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
})




async function bootstrap() {
  httpServer.listen(3000, () => {
    console.log("Backend lancé sur http://localhost:3000");
  });
}

bootstrap();