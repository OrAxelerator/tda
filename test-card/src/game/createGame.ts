import { Deck } from "../engine/Deck";
import { GameState } from "../engine/GameState";
import { GameEngine } from "../engine/GameEngine";
import { Player } from "../engine/Player";


export function 
createGame(cards:any[]) {

    const deck = new Deck(cards);

    deck.shuffle();


    const state = new GameState(deck);


    const engine = new GameEngine(state);


    engine.addPlayer(
        new Player("1", "Axel")
    );


    engine.addPlayer(
        new Player("2", "Bob")
    );


    engine.startGame();


    return engine;
}