import { Deck } from "./Deck";
import { Player } from "./Player";


export type GamePhase =
    "waiting" |
    "playing" |
    "finished";


export class GameState {

    roomId: string | null | undefined;

    // bots: 

    players: Player[];

    deck: Deck;

    discardPile: number[];

    currentPlayerId: string | null;

    turn: number;

    phase: GamePhase;


    constructor(deck: Deck, roomId: string | null | undefined) {

        this.players = [];

        // this.bots = [];

        this.deck = deck;

        this.discardPile = [];

        this.currentPlayerId = null;

        this.turn = 0;

        this.phase = "waiting";

        this.roomId = roomId;
    }

}
