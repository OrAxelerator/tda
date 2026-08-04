import express from "express";
import cors from "cors";
import path from "node:path";
import { readFile } from "node:fs/promises";

import { GameEngine } from "./game/GameEngine";
import { GameState } from "./game/GameState";
import { Player } from "./game/Player";
import { Deck } from "./game/Deck";
import type { Card as EngineCard } from "./game/Card";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

const players = [
  new Player("1", "bob"),
  new Player("2", "alice"),
];

let engine: GameEngine | null = null;

async function start() {
  try {
    const cardsPath = path.join(process.cwd(), "public", "cards.json");
    const raw = await readFile(cardsPath, "utf8");
    const cards = JSON.parse(raw) as EngineCard[];
    const cardsCopy = cards.map((card) => ({ ...card }));

    const state = new GameState(new Deck(cardsCopy));
    

    state.players.push(...players);

    state.deck.shuffle()

    engine = new GameEngine(state, cardsCopy);
    engine.startGame();

    console.log(`Loaded ${cards.length} cards`);
  } catch (error) {
    console.error("Failed to load cards.json", error);
  }
}


app.get("/state", (req, res) => {
  if (!engine) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }

  res.json({ success: true, state: engine.getState() });
});




app.get("/players", (req, res) => { // get list of player
  if (!engine) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }
    console.log("get player yees");
  res.json({ success: true, players: engine.getPlayers() });
});




app.get("/players/:playerId/cards", (req, res) => {
  if (!engine) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }
  console.log("try fetch caard");
  const { playerId } = req.params;
  res.json({ success: true, cards: engine.getPlayerCards(playerId) });
});


app.get("/discard-pile", (req, res) => {
  if (!engine) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }

  res.json({ success: true, discardPile: engine.getDiscardPile() });
});

app.post("/play", (req, res) => {
  if (!engine) {
    return res.status(500).json({
      success: false,
      message: "Game engine is not ready yet",
    });
  }

  try {
    const { playerId, cards } = req.body as {
      playerId: string;
      cards: number[];
    };  
    console.log("player ", playerId, "joue");
    console.log("ses cartes : ", cards);

    engine.playCards(playerId, cards);

    res.json({
      success: true,
      state: engine.state,
    });
    console.log("carte joué");

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});


app.post("/game/play", (req, res) => {
  if (!engine) {
    return res.status(500).json({ success: false, message: "Game engine is not ready yet" });
  }

  const { playerId, cardId } = req.body as {
    playerId: string;
    cardId: number;
  };

  engine.playCard(playerId, cardId);

  res.json({ success: true, state: engine.getStateForFrontend() });
});


async function bootstrap() {
  await start();

  app.listen(3000, () => {
    console.log("Backend lancé sur http://localhost:3000");
  });
}

bootstrap();  