  function getStateCardImg(deckLength) {


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


export default function Pile({ discardPileLength, isActive, discardPileCard}) {


    if (discardPileLength === 0) {
        return <p>Pas de carte dans la pile</p>;
    }

    if (isActive) {
        return (
            <div style={{ display: "grid" }}>
                <div className="pileContainer pile ">
                    {discardPileCard.map((cardId, index) => {
                        const id = String(cardId).padStart(2, "0");
                        const cardLink = `https://tda-1.onrender.com/card/${id}_theme1.png`;

                        return (
                            <div key={`${cardId}-${index}`}>
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
    const cardLink = `https://tda-1.onrender.com/card/${id}_theme1.png`;

    return (
        <div style={{ display: "grid"}}>
            <div className="pileContainer pile is-active">
                <div key={`hidden-${topCardId}`} >
                    <img className="pileHiddenCard" src={cardLink} alt={`Carte ${id}`}  />
                </div>
                <img src={`/src/assets/deck/${getStateCardImg(discardPileLength)}.png`}  style={{width:"15%"}}/>
            </div>
        </div>
    );
}
