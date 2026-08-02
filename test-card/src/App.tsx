import { useEffect, useState, type Key } from "react";
import { createGame } from "./game/createGame";

import "./App.css";

import Card from './components/Card' 

function App() {
  const [engine, setEngine] = useState<any>(null);
  const [allCards, setAllCards] = useState<any[]>([]); //debug
  const [, refresh] = useState(0);
  const [debugInput, setDebugInput] = useState("");
  const [debugCardName, setDebugCardName] = useState("Aucune carte");

  const ListOfSelectedCard: any[] | (() => any[]) = [];
  const ListOfSelectedCard2: any[] | (() => any[]) = [];
  const [selectedCards, setSelectedCard] = useState(ListOfSelectedCard);
  const [selectedCards2, setSelectedCard2] = useState(ListOfSelectedCard2);

  const [seeDiscardPile, setSeeDiscardPile] = useState(true)

  useEffect(() => {
    async function start() {
      const response = await fetch("/cards.json");

      const cards = await response.json();
      const cardsCopy = cards.map((card: any) => ({ ...card }));

      setAllCards(cardsCopy); //debug

      const game = createGame(cards);

      setEngine(game);
    }

    start();
  }, []);


  const handleClick = () => {
    console.log("CLICK AXEL");
    engine.drawCard("1");
    engine.nextTurn();
    console.log(engine.state.players[0].hand);
    refresh((x) => x + 1);
  };
  const handleClick2 = () => {
    console.log("CLICK BOB");
    engine.drawCard("2");
    engine.nextTurn();
    console.log(engine.state.players[0].hand);
    refresh((x) => x + 1);
  };


  const play = (selectedCard: any[]) => {
    engine.state.currentPlayerId == "1" ? "Axel" : "bob"
    for (let i = 0; i < engine.state.players.length; i++){
      if (engine.state.players[i].id == engine.state.currentPlayerId){
        const currentPlayer = engine.state.players[i]
        console.log(currentPlayer.name, "joue sa main de : ");
        console.log("carte en main : ", currentPlayer.hand);
        console.log("carte SELECT : ", selectedCard); // liste des ID

        engine.playCards(engine.state.currentPlayerId, selectedCard)
        
      }
    }

    // suprimer
    setSelectedCard([]) // sure que bonne idée ?
    refresh((x) => x +1);

  }

  const duplicateSelectedCard = () => {
    if (!engine) return;

    const selectedCardId = selectedCards[0];

    if (selectedCardId === undefined) {
      console.warn("Aucune carte sélectionnée pour la duplication.");
      return;
    }

    const cardToDuplicate = engine.state.players[0].hand.find(
      (card: { id: any }) => card.id === selectedCardId,
    );

    if (!cardToDuplicate) {
      console.warn("Carte sélectionnée introuvable dans la main d’Axel.");
      return;
    }

    const duplicatedCard = { ...cardToDuplicate };

    setSelectedCard((prevSelectedCards) => {
      const nextSelectedCards = [...prevSelectedCards, duplicatedCard.id];
      return nextSelectedCards;
    });

    refresh((x) => x + 1);
  };

  



  if (!engine) {
    return <p>Chargement...</p>;
  } else {


  const showInfo = (truc: any) => {
    console.log("---------------------------- SHOW INFO ----------------------------");
    console.log("engine.state", truc);
    console.log("engine.state.turn", truc?.turn);
    console.log("engine.state.discardPile", truc?.discardPile);
    console.log("------------------------------------------------------------------");
  };


  const showDiscardPile = () => {
    setSeeDiscardPile(!seeDiscardPile)
    refresh((x) => x+1)
  }

      return (
      <>

        <input
          value={debugInput}
          onChange={(e) => setDebugInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const normalizedInputId = String(debugInput).trim().padStart(2, "0");
              const foundCard = [
                ...allCards,
                ...engine.state.players.flatMap((player: { hand: any[] }) => player.hand),
              ].find(
                (card: { id: any; name: string }) =>
                  String(card.id).trim().padStart(2, "0") === normalizedInputId,
              );
              setDebugCardName(foundCard ? foundCard.name : "Aucune carte trouvée");
            }
          }}
          placeholder="DEBUG : ID to Card"
        />

        <p>Debug carte : {debugCardName}</p>

        <p>Tour : {engine.state.turn}</p>

        <p>
          Joueur actuel ({engine.state.currentPlayerId == "1" ? "Axel" : "bob"})
          :{engine.state.currentPlayerId}
        </p>

        <p>Son nombre de carte :{engine.state.players[0].hand.length}</p>

        <div style={{ display: "flex", flexDirection: "row" }}>
          <button onClick={handleClick}>Give 1 carte a Axel</button>
          <button onClick={handleClick2}>Give 1 carte a Bob</button>
        </div>

        <h3>Cards of palyers : </h3>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="cardContainer">

            <Card
              enginePlayerHand={engine.state.players[0].hand}
              selectedCard={selectedCards}
              setSelectedCard={setSelectedCard}
            />
          </div>

          <div className="cardContainer">
            {
              // pair.map((el, index) => {
              engine.state.players[1].hand.map((el, index) => {
                const id_string = el.id;
                // console.log(id_string);

                const id = String(id_string).padStart(2, "0");

                const cardLink = `http://localhost:5173/card/${id}_theme1.png`;
                // console.log(id);

                const numberOfCards = engine.state.players[1].hand.length;

                //param transslate y:
                const weight = 2.9;

                const translateY = () => {
                  // console.log(index+1);
                  if (Math.round(numberOfCards / 2) === index + 1) {
                    return `translateY(${-weight * 1.2 * (numberOfCards - index - 1)}px)`;
                  }
                  if (index < Math.round(numberOfCards / 2)) {
                    return `translateY(${-weight * (index + 1)}px)`;
                  } else {
                    //nb carte - index
                    return `translateY(${-weight * (numberOfCards - index)}px)`;
                  }
                };

                const rotate = () => {
                  const center = (numberOfCards - 1) / 2;
                  const angle = (index - center) * 1.5;

                  return `rotate(${angle}deg)`;
                };
                //  console.log("el.id", el.id);

                //  console.log("selectedCards.includes(el.id)", selectedCards.includes(el.id));
                return (
                  <div key={index}>
                    <img
                      src={cardLink}
                      alt={el.name}
                      className={
                        selectedCards2.includes(el.id)
                          ? "cardImg cardSelected"
                          : "cardImg"
                      }
                      style={
                        {
                          "--card-transform": `${translateY()} ${rotate()}`,
                        } as React.CSSProperties
                      }
                      onClick={() => {
                        if (selectedCards2.includes(el.id)) {
                          setSelectedCard2(
                            selectedCards2.filter((id) => id !== el.id),
                          );
                        } else {
                          setSelectedCard2([...selectedCards2, el.id]);
                        }
                      }}
                    />
                  </div>
                );
              })
            }
          </div>
        </div>


            
          <div style={{ display: seeDiscardPile ? "none" : "grid" }}>
            <div>
              <div className="cardContainer pile">
                {
              // pair.map((el, index) => {
              engine.state.discardPile.map((el: { id: any; name: string | undefined; }, index: number) => {
                const id_string = el;
                // console.log(id_string);

                const id = String(id_string).padStart(2, "0");

                const cardLink = `http://localhost:5173/card/${id}_theme1.png`;
                // console.log(id);

                const numberOfCards = engine.state.discardPile.length;

                //param transslate y:
                const weight = 2.9;

                const translateY = () => {
                  // console.log(index+1);
                  if (Math.round(numberOfCards / 2) === index + 1) {
                    return `translateY(${-weight * 1.2 * (numberOfCards - index - 1)}px)`;
                  }
                  if (index < Math.round(numberOfCards / 2)) {
                    return `translateY(${-weight * (index + 1)}px)`;
                  } else {
                    //nb carte - index
                    return `translateY(${-weight * (numberOfCards - index)}px)`;
                  }
                };

                const rotate = () => {
                  const center = (numberOfCards - 1) / 2;
                  const angle = (index - center) * 1.5;

                  return `rotate(${angle}deg)`;
                };
                //  console.log("el.id", el.id);
                //  console.log("selectedCards.includes(el.id)", selectedCards.includes(el.id));
                return (
                  <div key={index}>
                    <img
                      src={cardLink}
                      alt={el.name}
                      style={
                        {
                          "--card-transform": `${translateY()} ${rotate()}`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                );
              })
            }
              </div>
            </div>
          </div>


        <button
          onClick={() => {play(selectedCards)}}
        >
          JOUER (pour : {engine.state.currentPlayerId == "1" ? "Axel" : "bob"})
        </button>

        <button onClick={duplicateSelectedCard}>
          Duppliquer 1 carte de AXEL
        </button>


        <button onClick={() => showInfo(engine.state)}>
          SHOW INFO GAMEENGINE
        </button>
        <button onClick={showDiscardPile}>
          AFFicher PILE
        </button>
      </>
    );
  }
}

export default App;
