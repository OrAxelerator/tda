import { Card } from './Card';


export class Player {

    id: string;

    name: string;

    hand: Card[];


    constructor(
        id: string,
        name: string
    ) {

        this.id = id;

        this.name = name;

        this.hand = [];
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