import { Card } from './Card';


export class Player {

    id: string;

    name: string;

    hand: Card[];

    isHost: boolean;

    isWinner: boolean;


    constructor(
        id: string,
        name: string,
        isHost: boolean,
        isWinner: boolean,
    ) {

        this.id = id;

        this.name = name;

        this.isHost = isHost;

        this.hand = [];

        this.isWinner = false;
    }


    addCard(card: Card) {

        this.hand.push(card);

    }


    removeCard(cardId:number): Card | undefined {

        const index = this.hand.findIndex(
            card => card.id === cardId
        );


        if(index === -1)
            return undefined;


        return this.hand.splice(index,1)[0];
    }
}