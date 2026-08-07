import { type CSSProperties, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Card from "./Card";
import "../App.css";
import { useAuth } from "../components/auth-context";
import { io, type Socket } from "socket.io-client";
import { toast } from "react-toastify";
import { LeaveRoomButton } from "./LeaveRoomButton";


// socket.on(...)          // écouter un événement

// socket.emit(...)        // envoyer un événement

// socket.off(...)         // arrêter d'écouter

// socket.disconnect()     // fermer complètement la connexion


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

  const [seeDiscardPile, setSeeDiscardPile] = useState(false);

  const { user, logout } = useAuth();

  const [phase, setPhase] = useState("");
  const [ListUser, setListUser] = useState([]);

  const [isHost, setIsHost] = useState(false);

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
      data.players.forEach((player: any) => {
        console.log("cjeck of host ----")
        console.log("player.uid:", player.id, "user?.uid:", user?.uid);
        if (player.id === user?.uid) {
          setIsHost(player.isHost);
        }});

    } catch (err) {
      console.error(err);
    }
  }

  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:3000", {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connecté :", newSocket.id);
      if (roomId) {
        console.log("Emission joinRoom avec roomId=", roomId);
        newSocket.emit("joinRoom", roomId);
      }
      newSocket.emit("test", "HELLOWORLD");
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket déconnecté :", reason);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Erreur de connexion socket :", error);
    });

    newSocket.onAny((event, ...args) => {
      console.log("Evenement socket reçu :", event, args);
    });

    newSocket.on("gameUpdated", (state: any) => {
      console.log("---------------- GAME UPDATE --------------------");
      console.log(state);
      console.log("---------------- GAME UPDATE ----");
    });

    newSocket.on("gameState", (state: any) => {
      console.log("État du jeu reçu :!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.log("Nouvel état du jeu :", state);
      setListUser(state.players);
      setPhase(state.phase);
      getCard();
    });

    setSocket(newSocket);

    return () => {
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.off("connect_error");
      newSocket.offAny();
      newSocket.off("gameUpdated");
      newSocket.off("gameState");
      newSocket.disconnect();
    };
  }, [roomId]);

  function playCard(cardId: string, userId, roomId:string) {
    console.log("play card from fakePlay");
    socket?.emit("playCard", {
      roomId,
      userId,
      cardId,
    });
  }

  function faKePlayCard() {
    console.log("fakePlay");
    const cards = [12, 13]; // ud de cartes
    const userID = "EOXPDe29eZSbM3dCUyGe31Xrg8L2"; // id de test@gmail.com
    playCard(cards, userID, roomId);
  }

  const sayHello = () => {
    console.log();
    console.log("--------------------");
    console.log("SAY HRLLOOOO :)))");
    const txt = "HELLO from front";
    if (!socket) {
      console.warn("Socket non initialisé, impossible d'émettre sayHello");
      return;
    }
    if (!socket.connected) {
      console.warn("Socket non connecté, emission différée sayHello");
      return;
    }
    socket.emit("sayHello", txt);
  }



  async function getGameState() {
    console.log("try getGameState");

    try {
      const res = await fetch(`http://localhost:3000/rooms/${roomId}/state`);
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  }

async function startGame() {
  try {
    console.log("----------------------------------")
    console.log("Starting game for roomId:", roomId);
    const res = await fetch(`http://localhost:3000/rooms/${roomId}/startGame`,
  {
    method: "POST",
  });

    console.log(res.status);
console.log(res.ok);

    const data = await res.json();
    console.log("startGame response:", data);

    if (data.success) {
      console.log("Game started successfully");
      // Optionally, you can update the phase or other state here
      getPhase(); // Refresh the phase after starting the game
      getCard(); // Refresh the player's hand after starting the game
      // getDiscardPile(); // Refresh the discard pile after starting the game
      refresh((x) => x + 1); // Trigger a re-render if needed
    } else {
      console.error("Failed to start game:", data.message);
    }
  } catch (err) {
    console.error("Error starting game:", err);
  }
}

async function getPhase() {
  try {
    console.log("getPhase called", { roomId });

    if (!roomId) {
      console.warn("roomId is missing");
      return;
    }

    const url = `http://localhost:3000/rooms/${roomId}/phase`;
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
      // const res = await fetch("http://localhost:3000/players/1/cards");
    const res = await fetch(
        `http://localhost:3000/players/${encodeURIComponent(user.uid)}/cards?roomId=${encodeURIComponent(roomId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("getCard response status", res.status);
      const data = await res.json();
      console.log(data);
      setPlayerHand(data.cards);
      refresh((x) => x + 1);
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
        toast.error("BRUUUUH"); // TO TEST

      } else {
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

      <button onClick={faKePlayCard}>PLAY</button>

      <div style={{ display: seeDiscardPile ? "none" : "grid" }}>
        <div>
       <div className="cardContainer pile">
  {discardpileCard.length === 0 ? (
    <p>Pas de carte dans la pile</p>
  ) : (
    discardpileCard.map((el, index) => {
      const id = String(el).padStart(2, "0");
      const cardLink = `https://tda-1.onrender.com/card/${id}_theme1.png`;

      const numberOfCards = discardpileCard.length;
      const weight = 2.9;

      const translateY = () => {
        if (Math.round(numberOfCards / 2) === index + 1) {
          return `translateY(${-weight * 1.2 * (numberOfCards - index - 1)}px)`;
        }

        if (index < Math.round(numberOfCards / 2)) {
          return `translateY(${-weight * (index + 1)}px)`;
        }

        return `translateY(${-weight * (numberOfCards - index)}px)`;
      };

      const rotate = () => {
        const center = (numberOfCards - 1) / 2;
        const angle = (index - center) * 1.5;

        return `rotate(${angle}deg)`;
      };

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
  )}
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

        
        {
          isHost ? (
            <h5>Vous êtes l'hôte de la partie</h5>
          ) : (
            <h5>Vous êtes un joueur</h5>
          )
        }

              
        {
          isHost ? (
           <button
           onClick={startGame}
           >START GAME</button>
          ) : (
            <h5>Vous êtes un joueur</h5>
          )
        }

        <button
        onClick={sayHello}
        >Say Hello</button>

        <LeaveRoomButton roomId={roomId} playerId={user.uid} />

    </>
  );
}

export default Game;
