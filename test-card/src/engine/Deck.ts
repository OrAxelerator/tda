import { Card } from './Card';


export class Deck {

    cards: Card[];


    constructor(cards: Card[]) {
        this.cards = cards;
    }


    shuffle() {

        for(let i = this.cards.length - 1; i > 0; i--) {

            const j = Math.floor(Math.random() * (i + 1));

            [
                this.cards[i],
                this.cards[j]
            ] = [
                this.cards[j],
                this.cards[i]
            ];
        }
    }


    draw(): Card | undefined {

        return this.cards.pop();

    }


    size(): number {

        return this.cards.length;

    }
}