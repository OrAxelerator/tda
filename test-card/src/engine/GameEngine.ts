import { GameState } from './GameState';
import { Player } from "./Player";


export class GameEngine {

    state: GameState;


    constructor(state: GameState) {

        this.state = state;

    }


    startGame() {

        if(this.state.players.length < 2 || this.state.players.length > 6)
            throw new Error("Not enough players");


        this.state.phase = "playing";

        this.state.turn = 1;

        this.state.currentPlayerId =
            this.state.players[0].id;


        // get 5 cards for each player
        for (const player of this.state.players) {
            for (let i = 0; i < 5; i++) {
                this.drawCard(player.id);
            }
        }


        
    }


    addPlayer(player:Player) {

        this.state.players.push(player);

    }


    drawCard(playerId:string) {

        const player =
            this.getPlayer(playerId);


        const card =
            this.state.deck.draw();


        if(card) {
            player?.addCard(card);
        }
    }


    nextTurn() {

        const index =
            this.state.players.findIndex(
                p =>
                p.id === this.state.currentPlayerId
            );


        const next =
            (index + 1) %
            this.state.players.length;


        this.state.currentPlayerId =
            this.state.players[next].id;


        this.state.turn++;
    }


    getPlayer(id:string) {

        return this.state.players.find(
            p => p.id === id
        );

    }


    getState(){

        return this.state;

    }
}