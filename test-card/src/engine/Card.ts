export type Suit = 
    "spades" | 
    "hearts" | 
    "diamonds" | 
    "clubs";


export class Card {

    id: number;
    suit: Suit;
    value: number;
    name: string;
    asset: string;


    constructor(
        id: number,
        suit: Suit,
        value: number,
        name: string,
        asset: string
    ) {
        this.id = id;
        this.suit = suit;
        this.value = value;
        this.name = name;
        this.asset = asset;
    }
}