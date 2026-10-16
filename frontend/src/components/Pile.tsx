import type { CSSProperties } from "react";

//   function getStateCardImg(deckLength: number) {


//     if (deckLength === 1) {
//       return "0"
//     }
//     if (deckLength <=  5) {
//       return "1"
//     }
//     if (deckLength >= 6 && deckLength <= 10 ) {
//       return "3"
//     } 
//     if (deckLength >= 11) {
//       return "4"
//     }

//   }


type PileProps = {
    discardPileLength: number;
    isActive: boolean;
    discardPileCard: number[];
};

export default function Pile({ discardPileLength, isActive, discardPileCard}: PileProps) {


    if (discardPileLength === 0) {
        return (
        <div style={{ display: "grid" }}>
            <div className="pileContainer pile pileFull">
                <p style={{color:"black"}}>La pile est vide, mettez la carte de votre choix</p>
            </div>
        </div>
        )
    }

    if (isActive) {
        return (
            <div style={{ display: "grid" }}>
                <div className="pileContainer pile pileFull">
                    {discardPileCard.map((cardId, index) => { // affiche toute les cartes
                        const id = String(cardId).padStart(2, "0");
                        const cardLink = `/cards/${id}_theme1.png`;
                        const cardWidth = `min(clamp(60px, 8vw, 132px), calc((80vw - ${(discardPileLength - 1) * 2}px) / ${discardPileLength}))`;

                        const cardStyle = {
                            width: cardWidth,
                            "--card-rand": `${((index * 37) % 100) / 100}`,
                        } as CSSProperties;

                        return (
                            <div
                                key={`${cardId}-${index}`}
                                className="card pileCardZoom"
                                style={cardStyle}
                            >
                                <img src={cardLink} alt={`Carte ${id}`} />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const topCardIds = [...discardPileCard].slice(-6) // obtient les 5 dernière cartes de la pile

    return (
        <div style={{ display: "grid"}}>
            {/* .pilePreview useless .. */}
            <div className="pileContainer pile pileFull"> 

                 {topCardIds.map((cardId, index) => { // affiche toute les cartes
                        const id = String(cardId).padStart(2, "0");
                        const cardLink = `/cards/${id}_theme1.png`;
                        const cardWidth = `min(clamp(60px, 8vw, 132px), calc((80vw - ${(discardPileLength - 1) * 2}px) / ${discardPileLength}))`;

                        const cardStyle = {
                            width: cardWidth,
                            "--card-rand": `${((index * 37) % 100) / 100}`,
                        } as CSSProperties;

                        return (
                            <div
                                key={`${cardId}-${index}`}
                                className="card pileCardZoom"
                                style={cardStyle}
                            >
                                <img src={cardLink} alt={`Carte ${id}`} />
                            </div>
                        );
                    })}
                {/* <div
                    className="pileDeckBackWrapper pileCardZoom"
                >
                    <img className="pileDeckBack" src={`/src/assets/deck/${getStateCardImg(discardPileLength)}.png`} alt="Dos de la defausse" />
                </div> */}
            </div>
        </div>
    );
}
