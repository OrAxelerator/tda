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
        return null;
    }

    if (isActive) {
        return (
            <div style={{ display: "grid" }}>
                <div className="pileContainer pile pileFull">
                    {discardPileCard.map((cardId, index) => { // affiche toute les cartes
                        const id = String(cardId).padStart(2, "0");
                        const cardLink = `https://tda-1.onrender.com/card/${id}_theme1.png`;
                        const cardWidth = `min(clamp(60px, 8vw, 132px), calc((80vw - ${(discardPileLength - 1) * 2}px) / ${discardPileLength}))`;

                        return (
                            <div key={`${cardId}-${index}`} className="card">
                                <img src={cardLink} alt={`Carte ${id}`} style={{ width: cardWidth }} />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const topCardId = discardPileCard[discardPileCard.length - 1];
    const id = String(topCardId).padStart(2, "0");
    const cardLink = `https://tda-1.onrender.com/card/${id}_theme1.png`;

    return (
        <div style={{ display: "grid"}}>
            <div className="pileContainer pile pilePreview">
                <div key={`hidden-${topCardId}`} className="card">
                    <img className="pileHiddenCard" src={cardLink} alt={`Carte ${id}`}  />
                </div>
                <img className="pileDeckBack" src={`/src/assets/deck/${getStateCardImg(discardPileLength)}.png`} alt="Dos de la defausse" />
            </div>
        </div>
    );
}
