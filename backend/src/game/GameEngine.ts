import { GameState } from "./GameState";
import { Card } from "./Card";
import { Player } from "./Player";
import { Deck } from "./Deck";

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

    public setCards(cards: Card[]) {
        this.cards.clear();

        for (const card of cards) {
            this.cards.set(card.id, card);
        }
    }


    getRoomId(): string | null {
        // S'assurer de ne jamais retourner undefined ; normaliser en null
        return this.state.roomId ?? null;
    }

    startGame() {

        if(this.state.players.length < 2 || this.state.players.length > 6)
            throw new Error("Not enough players");

        if (this.state.phase === "playing") {
            throw new Error("La partie est déjà lancée");
        }

        this.state.phase = "playing";

        this.state.turn = 1;

        this.state.currentPlayerId =
            this.state.players[0].id;


        this.state.discardPile = [];
        this.state.deck.shuffle();

        for (const player of this.state.players) {
            player.hand = [];
        }

        // get 7 cards for each player
        for (const player of this.state.players) {
            for (let i = 0; i < 7; i++) {
                this.drawCard(player.id);
            }
        }


        
    }


    addPlayer(player:Player) {

        this.state.players.push(player);

    }


    removePlayer(playerId:string) {

        const removedIndex = this.state.players.findIndex(
            player => player.id === playerId
        );

        if (removedIndex === -1) {
            return;
        }

        const removedPlayer = this.state.players[removedIndex];
        const remainingPlayers = this.state.players.filter(
            player => player.id !== playerId
        );

        this.state.players = remainingPlayers;

        if (this.state.currentPlayerId === playerId) {
            if (remainingPlayers.length > 0) {
                const nextIndex = removedIndex % remainingPlayers.length;
                this.state.currentPlayerId = remainingPlayers[nextIndex].id;
            } else {
                this.state.currentPlayerId = null;
            }
        }

        if (removedPlayer.isHost && remainingPlayers.length > 0) {
            remainingPlayers[0].isHost = true;
        }

        if (remainingPlayers.length === 0) {
            this.state.phase = "waiting";
            this.state.turn = 0;
        }
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
        const player = this.getPlayer(playerId);
        const removedCard = player?.removeCard(card);

        if (!removedCard) {
            throw new Error(`Carte ${card} absente de la main du joueur`);
        }

        this.state.discardPile.push(card); // Reverse pile, last element end
    }

    takePile(playerId:string) {
        const player = this.getPlayer(playerId);
        if (!player ) {
            if (this.state.winPlayers.includes(playerId)) {
                throw new Error("Vous avez gagnez pq prendre la pile ..")
            }
            throw new Error("Joueur n'existe pas.")
        }
        if (this.state.currentPlayerId !== playerId) {
            throw new Error("Player try to play during the turn of other");
        }
        const discardPile = this.state.discardPile;
        if (this.state.discardPile.length >= 1) {
            
            this.state.discardPile.forEach(el => {
                const card = this.getCard(el);
                if (!card) {
                    throw new Error("Null card from discard pile ..");
                }
                player.addCard(card);
            });
            this.state.discardPile = [] // vide totalement la discard pile

            this.state.players.forEach(player => {
                if (player.id != playerId ) {
                    if (player.hand.length <= 2) {

                    }
                }
            });

        }else {
            console.log("discardPile : ");
            console.log(discardPile);
            throw new Error("DIscardPile have no card ..")
        }
    }

    refullPlayer(playerId:string) {
        if (!playerId) {
            return
        }
        const player = this.getPlayer(playerId);
        if (!player) {
            throw new Error("Joeur n'existe pas.")
        }
        if (player.hand.length >= 3) {
            // throw new Error("Player a déja 3 ou + carte ..")
        }
        const cardToAdd = 3 - player.hand.length

        if (this.state.deck.size() > 0) {
            for (let i = 0; i < cardToAdd; i++) {
                if (this.state.deck.cards.length >= 1){ // sup sa dcp ??
                    const lastCardOfDeck = this.state.deck.draw();
                    if (!lastCardOfDeck){ return } 
                    player.addCard(lastCardOfDeck);
                }
            }
        }else { // length = 0
            return // player ne prends pas de carte de la discard :(
        }
    }

nextTurn() {
    const currentIndex = this.state.players.findIndex(
        p => p.id === this.state.currentPlayerId
    );

    let nextIndex = (currentIndex + 1) % this.state.players.length;

    // On cherche le prochain joueur qui n'a pas encore gagné
    while (
        this.state.winPlayers.includes(
            this.state.players[nextIndex].id
        )
    ) {
        nextIndex = (nextIndex + 1) % this.state.players.length;
    }

    this.state.currentPlayerId =
        this.state.players[nextIndex].id;

    this.state.turn++;
}

    playCards(playerId: string, cards: number[]) {
        if (this.state.phase !== "playing") {
            throw new Error("La partie n'est pas en cours");
        }

        if (this.state.currentPlayerId !== playerId) {
            throw new Error("Ce n'est pas le tour de ce joueur");
        }

        if (!Array.isArray(cards) || cards.length === 0) {
            throw new Error("Aucune carte jouée");
        }

        if (cards.length > 4) {
            throw new Error("Impossible de jouer plus de 4 cartes");
        }

        if (cards.some(cardId => !Number.isInteger(cardId))) {
            throw new Error("Carte invalide");
        }

        if (new Set(cards).size !== cards.length) {
            throw new Error("Impossible de jouer deux fois la même carte");
        }

        const player = this.getPlayer(playerId);
        if (!player) {
            throw new Error("Joueur introuvable");
        }

        const handIds = new Set(player.hand.map(card => card.id));
        for (const cardId of cards) {
            if (!handIds.has(cardId)) {
                throw new Error(`Le joueur ne possède pas la carte ${cardId}`);
            }
        }

        for (const otherPlayer of this.state.players) {
            if (otherPlayer.id === playerId) {
                continue;
            }

            if (otherPlayer.hand.some(card => cards.includes(card.id))) {
                throw new Error(`Carte présente dans la main de ${otherPlayer.name}`);
            }
        }

        for (const cardId of cards) {
            if (this.state.deck.cards.some(deckCard => deckCard.id === cardId)) {
                throw new Error(`La carte ${cardId} est encore dans le deck`);
            }

            if (this.state.discardPile.includes(cardId)) {
                throw new Error(`La carte ${cardId} est déjà dans la pile`);
            }
        }

        const playedCards = cards.map(cardId => {
            const card = this.getCard(cardId);

            if (!card) {
                throw new Error(`Carte inconnue: ${cardId}`);
            }

            return card;
        });

        const firstValue = playedCards[0].value;
        if (playedCards.some(card => card.value !== firstValue)) {
            throw new Error("Les cartes jouées ensemble doivent avoir la même valeur");
        }

        const lastDiscardId = this.state.discardPile[this.state.discardPile.length - 1];
        const lastDiscardCard = lastDiscardId ? this.getCard(lastDiscardId) : undefined;

        if (lastDiscardCard && firstValue < lastDiscardCard.value) {
            throw new Error("La carte jouée doit être supérieure ou égale à la dernière carte de la pile");
        }

        for (const cardId of cards) {
            this.discardCards(playerId, cardId);
        }

        if (player.hand.length === 0) {
            this.state.winPlayers.push(playerId)
            this.state.players = this.state.players.filter(
                p => p.id !== playerId // supr player de gameState mais pas de backend/socket
            );  

            if (this.state.winPlayers.length - 1 == this.state.players.length) {
                this.state.phase = "finished"; // end of game
                //next turn ?
                return;
            }
        }

        this.nextTurn();
    }


    addBots(numberOfBot: number) {
        
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
            isHost: player.isHost,
        }));
    }

}
