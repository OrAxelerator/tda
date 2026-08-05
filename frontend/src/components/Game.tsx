import { type CSSProperties, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Card from "./Card";
import Alert from "./Alert";
import "../App.css";
import { useAuth } from "../components/auth-context";
import { io } from "socket.io-client";

type PlayerCard = {
  id: number;
  name?: string;
};

function Game() {
  const [inputValue, setInputValue] = useState("");

  const [playerHand, setPlayerHand] = useState<PlayerCard[]>([]);
  const [selectedCards, setSelectedCard] = useState<number[]>([]);
  const [, refresh] = useState(0);
  const [discardpileCard, setDiscardpileCard] = useState<number[]>([]);
  const [alertMsg, setAlertMsg] = useState("");

  const [seeDiscardPile, setSeeDiscardPile] = useState(false);

  const { user, logout } = useAuth();
  const [isWaitingRoom, setIsWaitingRoom] = useState(true);

  const [phase, setPhase] = useState("");
  const [ListUser, setListUser] = useState([]);

  const showDiscardPile = () => {
    setSeeDiscardPile(!seeDiscardPile);
    refresh((x) => x + 1);
  };

  const params = useParams<{ roomCode: string }>();
  const roomId = params.roomCode ?? "";

  useEffect(() => {
    // getCard();
    // getDiscardPile();
    getPhase();
    getListUser();
  }, []);

  async function getListUser() {
    try {
      const res = await fetch(`http://localhost:3000/players?roomId=${encodeURIComponent(roomId)}`);
      const data = await res.json();
      console.log("ListUser:", data.players);
      setListUser(data.players);
    } catch (err) {
      console.error(err);
    }
  }


  const [socket] = useState(() => io("http://localhost:3000"));

  useEffect(() => {

    socket.on("connect", () => {
      console.log("Connecté :", socket.id);

      socket.emit("howdy", "Bonjour depuis React !");
    });

    socket.on("hello", (msg) => {
      console.log("Serveur :", msg);
    });

    return () => {
      // socket.disconnect();
    };
  }, []);

  useEffect(() => {
  socket.on("playerJoined", (data) => {
    console.log("Nouveau joueur :", data);

    // ici tu peux mettre à jour ton état React
  });

  return () => {
    socket.off("playerJoined");
  };
}, []);

// THis should work
useEffect(() => {
  // rejoindre la room côté serveur
  socket.emit("joinRoom", roomId);

  // recevoir les mises à jour du GameState
  socket.on("gameState", (state) => {
    console.log("État du jeu reçu :!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("Nouvel état du jeu :", state);

    // exemple :
    setListUser(state.players);
    setPhase(state.phase);
  });

  return () => {
    socket.off("gameState");
  };
}, [roomId]);




  async function getGameState() {
    console.log("try getGameState");

    try {
      const res = await fetch(`http://localhost:3000/state?roomId=${encodeURIComponent(roomId)}`);
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  }


async function getPhase() {
  try {
    console.log("getPhase called", { roomId });

    if (!roomId) {
      console.warn("roomId is missing");
      return;
    }

    const url = `http://localhost:3000/phase?roomId=${encodeURIComponent(roomId)}`;
    console.log("fetching phase from", url);

    const res = await fetch(url);

    console.log("phase response status", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("phase response text", errorText);
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log("phase response body", data);

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch phase");
    }

    setPhase(data.phase ?? "");
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
      setPlayerHand(data.cards);
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

      setDiscardpileCard(data.discardPile);
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
          currentHand.filter((card) => !selectedCards.includes(card.id)),
        );
        setSelectedCard([]);
        getDiscardPile();
        refresh((x) => x + 1);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const getInfoPlayer = async () => {
    try {
      const idToken = await user.getIdToken();
      
    } catch (err) {
      console.error(err);
    }
  };
  // console.log("plaeerand: ", playerHand);
  // console.log("selectedCard: ", selectedCards);
  return (
    <>
      <h1>TDA Prototype</h1>

      <p>État du jeu : </p>

      <button onClick={getGameState}>GET STATE ROOT</button>
      <button onClick={getCard}>GET CARD "1"</button>

      <div style={{ marginTop: "1rem" }}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Entrez un chemin"
        />
        <button onClick={() => getDataX(inputValue)}>getDataX</button>
        <button onClick={getDiscardPile}>Get Pile</button>
      </div>

      <div
        style={{ display: "flex", flexDirection: "column", marginTop: "10em" }}
      >
        <div className="cardContainer">
          <Card
            enginePlayerHand={playerHand}
            selectedCard={selectedCards}
            setSelectedCard={setSelectedCard}
          />
        </div>
      </div>

      <button onClick={play}>PLAY</button>

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
                          ["--card-transform" as string]: `${translateY()} ${rotate()}`,
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

      <button onClick={showDiscardPile}>AFFicher PILE</button>


            <h5>Bienvenu : {user.uid} / {user.displayName} / {user.email}  </h5>


       <h4>PHASE : {phase}</h4>

        <h5>
            Player connecté :
            {
            ListUser.map((user, index) => (
              <div key={index} className={user.isHost ? "host" : "player"}> 
                {user.name} 
              </div>
            ))
            }
          </h5>

          <h5>
        </h5>

      <Alert msg={alertMsg} />
    </>
  );
}

export default Game;
