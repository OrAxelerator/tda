import { useState, useEffect } from "react";
import Card from './components/Card' 
import Alert from './components/Alert' 
import './App.css'

function App() {
  const [inputValue, setInputValue] = useState("");

  const [playerHand, setPlayerHand] = useState([]);
  const [selectedCards, setSelectedCard] = useState<number[]>([]);
  const [, refresh] = useState(0);
  const [discardpileCard, setDiscardpileCard] = useState<number[]>([]);
  const [alertMsg, setAlertMsg] = useState("")


  const [seeDiscardPile, setSeeDiscardPile] = useState(false)


  const showDiscardPile = () => {
    setSeeDiscardPile(!seeDiscardPile)
    refresh((x) => x+1)
  }


  useEffect(() => {
    getCard()
    getDiscardPile()
  }, []);





  async function getGameState() {
    console.log("desde");

    try {
      const res = await fetch("http://localhost:3000/state");
      const data = await res.json();
      console.log(data);

    } catch (err) {
      console.error(err);
    }
  }


  async function getCard() {
    console.log("get Czard");

    try {
      const res = await fetch("http://localhost:3000/players/1/cards");
      const data = await res.json();
      console.log(data);
      setPlayerHand(data.cards)

    } catch (err) {
      console.error(err);
    }
  }

  
  async function getDiscardPile() {
    console.log("get pile");

    try {
      const res = await fetch("http://localhost:3000/discard-pile");
      const data = await res.json();
      console.log(data.discardPile);
      console.log(typeof data);

      setDiscardpileCard(data.discardPile)

    } catch (err) {
      console.error(err);
    }
  }


  async function getDataX(x: string) {
    console.log("getDataX");

    try {
      const res = await fetch(`http://localhost:3000/${x}`);
      const data = await res.json();
      console.log(data);

    } catch (err) {
      console.error(err);
    }
  }


  async function play() {
    if (selectedCards.length === 0) {
      console.warn("Aucune carte sélectionnée");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: "1",
          cards: selectedCards,
        }),
      });

      const data = await res.json();
      console.log("Réponse play :", data);
      if (data.success === false) {
        console.error(data);
        setAlertMsg("BRUUUUUUUUUUUUH");
        window.setTimeout(() => setAlertMsg(""), 3000);
        console.log("erreur dans lors de play()");
        
      } else {
        setAlertMsg("");
        setPlayerHand((currentHand) =>
          currentHand.filter((card) => !selectedCards.includes(card.id))
        );
        setSelectedCard([]);
        getDiscardPile()
        refresh((x) => x + 1);
      }
      
    } catch (err) {
      console.error(err);
    }
  }

  // console.log("plaeerand: ", playerHand);
  // console.log("selectedCard: ", selectedCards);
  return (
    <>
      <h1>TDA Prototype</h1>

      <p>
        État du jeu :{" "}
      </p>

      <button onClick={getGameState}>
        GET STATE ROOT
      </button>
      <button onClick={getCard}>
        GET CARD "1"
      </button>

      <div style={{ marginTop: "1rem" }}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Entrez un chemin"
        />
        <button onClick={() => getDataX(inputValue)}>
          getDataX
        </button>
        <button onClick={getDiscardPile}>
          Get Pile
        </button>
      </div>


       <div style={{ display: "flex", flexDirection: "column" , marginTop:"10em"}}>
          <div className="cardContainer">

            <Card
              enginePlayerHand={playerHand}
              selectedCard={selectedCards}
              setSelectedCard={setSelectedCard}
            />

          </div>
        </div>

        <button onClick={play}>
          PLAY
        </button>

      


      <div style={{ display: seeDiscardPile ? "none" : "grid" }}>
            <div>
              <div className="cardContainer pile">
                {
              // pair.map((el, index) => {
              discardpileCard.map((el, index) => {
                const id_string = el;
                // console.log(id_string);

                const id = String(id_string).padStart(2, "0");

                const cardLink = `https://tda-1.onrender.com/card/${id}_theme1.png`;
                
                // console.log(id);

                const numberOfCards = discardpileCard.length;

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
                      alt={`Carte ${id}`}
                      style={
                        {
                          "--card-transform": `${translateY()} ${rotate()}`,
                        } as CSSProperties
                      }
                    />
                  </div>
                );
              })
            }
              </div>
            </div>
          </div>
            

        <button onClick={showDiscardPile}>
          AFFicher PILE
        </button>

                  <Alert msg={alertMsg} setAlertMsg={setAlertMsg} />
            

    </>
  );
}

export default App;