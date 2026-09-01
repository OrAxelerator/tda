import type { CSSProperties, MouseEvent } from "react";

function updatePileCardTilt(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const bottomBoost = y > 0 ? 1.85 : 1;

    event.currentTarget.style.setProperty("--pointer-rotate-x", `${y * -18 * bottomBoost}deg`);
    event.currentTarget.style.setProperty("--pointer-rotate-y", `${x * 18}deg`);
}

function resetPileCardTilt(event: MouseEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--pointer-rotate-x", "0deg");
    event.currentTarget.style.setProperty("--pointer-rotate-y", "0deg");
}

  function getStateCardImg(deckLength: number) {


    if (deckLength === 1) {
      return "0"
    }
    if (deckLength <=  5) {
      return "1"
    }
    if (deckLength >= 6 && deckLength <= 10 ) {
      return "3"
    } 
    if (deckLength >= 11) {
      return "4"
    }

  }


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
                                className="card pileCard3d"
                                style={cardStyle}
                                onMouseMove={updatePileCardTilt}
                                onMouseLeave={resetPileCardTilt}
                            >
                                <img src={cardLink} alt={`Carte ${id}`} />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const topCardId = discardPileCard[discardPileCard.length - 1];
    const id = String(topCardId).padStart(2, "0");
    const cardLink = `/cards/${id}_theme1.png`;

    return (
        <div style={{ display: "grid"}}>
            <div className="pileContainer pile pilePreview">
                <div
                    key={`hidden-${topCardId}`}
                    className="card pilePreviewCard pileCard3d"
                    onMouseMove={updatePileCardTilt}
                    onMouseLeave={resetPileCardTilt}
                >
                    <img className="pileHiddenCard" src={cardLink} alt={`Carte ${id}`}  />
                </div>
                <div
                    className="pileDeckBackWrapper pileCard3d"
                    onMouseMove={updatePileCardTilt}
                    onMouseLeave={resetPileCardTilt}
                >
                    <img className="pileDeckBack" src={`/src/assets/deck/${getStateCardImg(discardPileLength)}.png`} alt="Dos de la defausse" />
                </div>
            </div>
        </div>
    );
}
