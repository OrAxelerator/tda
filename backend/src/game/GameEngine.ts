import { GameState } from "./GameState";
import { Card } from "./Card";
import { Player } from "./Player";

export type PublicPlayer = Pick<Player, "id" | "name">;

export class GameEngine {

    public state: GameState;

    // Catalogue de toutes les cartes du jeu
    private readonly cards: Map<number, Card>;

    constructor(state: GameState, cards: Card[]) {

        this.state = state;

        // Création de la Map une seule fois
        this.cards = new Map(
            cards.map(card => [card.id, card])
        );
    }

    public getCard(id: number): Card | undefined {
        return this.cards.get(id);
    }


    getRoomId(): string | null {
        // S'assurer de ne jamais retourner undefined ; normaliser en null
        return this.state.roomId ?? null;
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

    discardCards(playerId:string, card: number) { // card = ID:number
        console.log("en train de sup I guess ?");
        console.log("discrdCards");
        console.log(this.state.players);
        for (let i = 0; i < this.state.players.length; i++) {
            if (this.state.players[i].id == playerId) { // find current player
                this.state.players[i].removeCard(card) // delete 1 by 1
                this.state.discardPile.push(card) // Reverse pile, last element end
            }
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

    playCards(playerId: string, cards: number[]) {
        // RECAP :
        // 1. Check if player play more than 4 cards
        // 2. Check in each hand if card is duplicate
        // 3. Check if card present in deck
        // (TO ADD) 4. Check if card present in defausse
        // 5. if multiples card, check if they all have the same values
        // 6. compare to last card in discardPile
        
        console.log("carte joué depuis gameEngine.ts");

        const hasDuplicateId = (arr: number[]) => {

            for (let i = 0; i < arr.length; i++) {
                for (let j = i + 1; j < arr.length; j++) {
                    if (arr[i] === arr[j]) {
                        return true;
                    }
                }
            }
            return false;
        };


        //1.
        if (cards.length > 4){
            console.log(cards.length);
            throw new Error(`TRICHE Player: ${playerId} joue avec plus de 4 carte .. (1)`);
        }

        // 2.
        // check if if a player (currentPlayer count) have already one of the card he plays (check by ID)
        this.state.players.forEach(player => { // for all players

            if (player.id != playerId) { // A CEHCK SEMBLE BOF ........
              // other player
              player.hand.forEach((card) => {
                // for all their cards
                cards.forEach((cardPlay) => {
                  // pour toute les cartes joué par jouer
                  if (card.id == cardPlay) {
                    // si carte de autre jouer == carte joué : triche
                    throw new Error(
                      `TRIIIIIIICHE, joueur qui joue a une carte présent dans la main de ${player.id} (2)`,
                    );
        

                  }
                });
              });
            } else {
              // player that play
              console.log("cards");
              console.log("----");

              if (hasDuplicateId(cards)) {
                // if card play present more than 1 time in hand : ban
                throw new Error(
                  "TRICHE, joue 1 carte qui est déja présente dans sa main (impossible) (2bis)",
                );
              }
            }
        });


        // 3.
        // regard toute les cards joué si elles sont présentes dans le deck
        cards.forEach(card => {
            if (this.state.deck.cards.some(deckCard => deckCard.id === card)) {
                throw new Error("TRICHE : player a joué une carte présente dans deck (3)");
            }
        });


        // 4.  TO ADD



        // 5. 
        if (cards.length > 1) {
            const firstCard = this.getCard(cards[0]);

            if (firstCard) {
                for (const card of cards) {
                    const currentCard = this.getCard(card);

                    if (!currentCard || currentCard.value !== firstCard.value) {
                    throw new Error("TRICHE : les cartes jouées n'ont pas la même valeur (5)");
                    }
                }
            }
        }

        // 6.
        console.log("6.");
        const firstPlayedCard = this.getCard(cards[0]);
        if (this.state.discardPile.length === 0) {
            console.log("pas de problème 1er carte");
        }
        else {
            console.log("debug 6:");
            // console.log("discard pile : ", this.state.discardPile);
            const idLastCard = this.state.discardPile[this.state.discardPile.length -1]
            const playedCard = this.getCard(cards[0]);
            const lastCard = this.getCard(idLastCard);
            // en partant principe que toute les cartes ont la même valeur:
            if (playedCard && lastCard && playedCard.value < lastCard.value) {
                throw new Error("TRICHE : la(les) cartes joué est plus petite que la dernière carte de la pioche (6)");
            }
        }










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

    getPhase() {
        return this.state.phase;
    }

    getStateForFrontend() {
        return {
            players: this.getPlayers(),
            discardPile: this.state.discardPile,
            currentPlayerId: this.state.currentPlayerId,
            turn: this.state.turn,
            phase: this.state.phase,
        };
    }

    getPlayerCards(playerId: string): Card[] {
        const player = this.getPlayer(playerId);
        return player ? player.hand : [];
    }

    getDiscardPile(): number[] {
        return this.state.discardPile;
    }

    playCard(playerId: string, cardId: number): void {
        this.playCards(playerId, [cardId]);
    }

    getPlayers(): PublicPlayer[] {
        return this.state.players.map((player) => ({
            id: player.id,
            name: player.name,
        }));
    }

}
