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

    discardCards(playerId:string, card) { // card = ID:number
        console.log("discrdCards");
        console.log(this.state.players);
        for (let i = 0; i < this.state.players.length; i++) {
            if (this.state.players[i].id == playerId) { // find current player
                this.state.players[i].removeCard(card) // delete 1 by 1
                this.state.discardPile.push(card)
            }
        }


        this.state.currentPlayerId
        // this.state.players

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

    playCards(playerId: string, cards: any[]) {
        // RECAP :
        // 1. Check if player play more than 4 cards
        // 2. Check in each hand if card is duplicate
        // 3. Check if card present in deck
        // (TO ADD) 4. Check if card present in defausse
        
        console.log("carte joué depuis gameEngine.ts");
        console.log(cards);

        const count = (arr: any[], el: any) => arr.filter((x: any) => x?.id === el?.id).length;


        //1.
        if (cards.length > 4){
            console.log(cards);
            console.log(cards.length);
            console.error(`TRICHE Player: ${playerId} joue avec plus de 4 carte .. `);
        }

        // 2.
        // check if if a player (currentPlayer count) have already one of the card he plays
        this.state.players.forEach(player => { // for all players
            console.log(player);  

            if (player.id != playerId){ // other player
                player.hand.forEach(card => { // for all their cards 
                    cards.forEach(cardPlay => { // pour toute les cartes joué par jouer
                        if (card.id == cardPlay.id){ // si carte de autre jouer == carte joué : triche
                            console.error(`TRIIIIIIICHE, joueur qui joue a une carte présent dans la main de ${playerId} `);
                        }
                        
                    });
                    
                });
            }else { // player that play
                cards.forEach(cardPlay => { // for each cards play (id)
                    if (count(cards,cardPlay) > 1){ // if card play present more than 1 time in hand : ban
                        console.error("TRICHE, joue 1 carte qui est déja présente dans sa main (impossible)");
                    }
                });
            }
        });


        // 3.
        // regard toute les cards joué si elles sont présentes dans le deck
        cards.forEach(card => {
            if (this.state.deck.cards.includes(card) == true ) {
                console.error("TRICHE : player a joué une carte présente dans deck");
            }
        });


        cards.forEach(card => {
            this.discardCards(playerId, card) // send ID by ID
        });


        console.log("carte(s) joué sans problème");
        // console.log("carte deckec : ", this.state.deck.cards.length);
        // let allCardExpectCurrentPlayer = this.state.deck.cards.length;
        // console.log("total : ", allCardExpectCurrentPlayer);
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