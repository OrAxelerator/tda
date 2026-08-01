import { useEffect, useState } from "react";
import { createGame } from "./game/createGame";

import "./App.css";

function App() {
  const [engine, setEngine] = useState<any>(null);
  const [, refresh] = useState(0);

  const ListOfSelectedCard = []
  const [selectedCards, setSelectedCard] = useState(ListOfSelectedCard);

  useEffect(() => {
    async function start() {
      const response = await fetch("/cards.json");

      // const aze = await fetch("/card/01_theme1.png");

      const cards = await response.json();

      const game = createGame(cards);

      setEngine(game);
    }

    start();
  }, []);

  const handleClick = () => {
    console.log("CLICK AXEL");
    engine.drawCard(engine.state.currentPlayerId);
    engine.nextTurn();
    console.log(engine.state.players[0].hand);
    refresh((x) => x + 1);
  };

  if (!engine) {
    return <p>Chargement...</p>;
  } else {
    console.log("---------");
    console.log(engine.state);
    console.log("---------");

    return (
      <>
        <h1>Card Game</h1>

        <p>Tour : {engine.state.turn}</p>

        <p>
          Joueur actuel ({engine.state.currentPlayerId == "1" ? "Axel" : "bob"})
          :{engine.state.currentPlayerId}
        </p>

        <p>Son nombre de carte :{engine.state.players[0].hand.length}</p>

        <div style={{ display: "flex", flexDirection: "row" }}>
          <button onClick={handleClick}>Give 1 carte a Axel</button>
          <button onClick={handleClick}>Give 1 carte a Bob</button>
        </div>

        <h3>Cards of palyers : </h3>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="cardContainer">
            {
              // pair.map((el, index) => {
              engine.state.players[0].hand.map((el, index) => {
                const id_string = el.id;
                // console.log(id_string);

                const id = String(id_string).padStart(2, "0");

                const cardLink = `http://localhost:5173/card/${id}_theme1.png`;
                // console.log(id);

                const numberOfCards = engine.state.players[0].hand.length;

                //param transslate y:
                const weight = 2.9;

                const translateY = () => {
                  console.log(Math.round(numberOfCards / 2));
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
                  console.log("--------");
                 console.log("selectedCards", selectedCards);
                //  console.log("el.id", el.id);
                if (selectedCards.includes(el.id)) {
                  console.log("selectedCards.includes(el.id)", selectedCards.includes(el.id));
                  console.log("el.id", el.id);
                  console.log("je suis laaaaaaaaaaaaaaaaaaaaaaaaaaaa")
                }
                //  console.log("selectedCards.includes(el.id)", selectedCards.includes(el.id));
                  console.log("--------");
                return (
                  <div key={index}>
                    <img
                      src={cardLink}
                      alt={el.name}
                      className={selectedCards.includes(el.id) ? "cardImg cardSelected" : "cardImg"}
                      style={{ "--card-transform": `${translateY()} ${rotate()}` } as React.CSSProperties}
                      onClick={() => {
                        if (selectedCards.includes(el.id)) {
                          setSelectedCard(selectedCards.filter((id) => id !== el.id));
                        } else {
                          setSelectedCard([...selectedCards, el.id]);
                        }
                      }}
                    />
                  </div>
                );
              })
            }
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

                const numberOfCards = engine.state.players[0].hand.length;

                //param transslate y:
                const weight = 2.9;


                           const translateY = () => {
                  console.log(Math.round(numberOfCards / 2));
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
                  const angle = (index - center) * 2.5;

                  return `rotate(${angle}deg)`;
                };


                return (
                  <div key={index}>
                    <div>{el.name}</div>
                    <img
                      src={cardLink}
                      alt={el.name}
                      className="cardImg"
                      style={{ "--card-transform": `${translateY()} ${rotate()}` } as React.CSSProperties}
                    />
                  </div>
                );
              })
            }
          </div>
        </div>
      </>
    );
  }
}

export default App;
