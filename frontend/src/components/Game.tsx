import { type CSSProperties, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { toast } from "react-toastify";
import Card from "./Card";
import { LeaveRoomButton } from "./LeaveRoomButton";
import { useAuth } from "../components/auth-context";
import "../App.css";
import "../game.css"

import Wainting from "./Waiting";
import { getDataConnect } from "firebase/data-connect";
import Pile from "./Pile";

type PlayerCard = {
  id: number;
  name?: string;
};

type RoomPlayer = {
  id: string;
  name: string;
  isHost?: boolean;
  cardCount?: number;
};

type ConnectedPlayer = {
  id: string;
  name: string;
};

type GameUpdatePayload = {
  roomId: string;
  discardCard: number[];
  deckLength: number;
  otherPlayers: RoomPlayer[];
  yourCard: PlayerCard[];
  numberOfTurn: number;
  currentPlayerId: string | null;
  phase: string;
  connectedPlayers: ConnectedPlayer[];
  state?: {
    players: RoomPlayer[];
  };
};

function Game() {
  const { user } = useAuth();
  const params = useParams<{ roomCode: string }>();
  const roomId = params.roomCode ?? "";

  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerHand, setPlayerHand] = useState<PlayerCard[]>([]);
  const [selectedCards, setSelectedCard] = useState<number[]>([]);
  const [discardPileCard, setDiscardPileCard] = useState<number[]>([]);
  const [seeDiscardPile, setSeeDiscardPile] = useState(true);
  const [phase, setPhase] = useState("");
  const [deckLength, setDeckLength] = useState(0);
  const [numberOfTurn, setNumberOfTurn] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<RoomPlayer[]>([]);
  const [connectedPlayers, setConnectedPlayers] = useState<ConnectedPlayer[]>([]);
  const [allPlayers, setAllPlayers] = useState<RoomPlayer[]>([]);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!user || !roomId) {
      return;
    }

    const newSocket = io("http://localhost:3000", {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      // Join typé pour que le backend puisse envoyer "yourCard" au bon joueur.
      newSocket.emit("joinRoom", {
        roomId,
        playerId: user.uid,
        playerName: user.displayName || user.email || "Joueur",
      });
    });

    newSocket.on("gameUpdate", (payload: GameUpdatePayload) => {
      if (!payload || payload.roomId !== roomId) {
        return;
      }

      const nextHand = payload.yourCard ?? [];
      const nextHandIds = new Set(nextHand.map((card) => card.id));

      setPlayerHand(nextHand);
      setSelectedCard((currentSelectedCards) =>
        currentSelectedCards.filter((cardId) => nextHandIds.has(cardId)),
      );
      setDiscardPileCard(payload.discardCard ?? []);
      setDeckLength(payload.deckLength ?? 0);
      setOtherPlayers(payload.otherPlayers ?? []);
      setNumberOfTurn(payload.numberOfTurn ?? 0);
      setCurrentPlayerId(payload.currentPlayerId ?? null);
      setPhase(payload.phase ?? "");
      setConnectedPlayers(payload.connectedPlayers ?? []);
      setAllPlayers(payload.state?.players ?? []);

      const currentUser = payload.state?.players?.find((player) => player.id === user.uid);
      setIsHost(Boolean(currentUser?.isHost));
    });

    newSocket.on("gameError", ({ message }: { message?: string }) => {
      toast.error(message || "Erreur socket");
    });

    newSocket.on("connect_error", (error) => {
      toast.error(`Socket impossible à connecter: ${error.message}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off("connect");
      newSocket.off("gameUpdate");
      newSocket.off("gameError");
      newSocket.off("connect_error");
      newSocket.disconnect();
    };
  }, [roomId, user]);

  if (!user) {
    return <p>Connexion requise.</p>;
  }

  const currentUser = user;

  async function startGame() {
    try {
      const res = await fetch(`http://localhost:3000/rooms/${roomId}/startGame`, {
        method: "POST",
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Impossible de lancer la partie");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur pendant le lancement de la partie");
    }
  }

  function playSelectedCards() {
    console.log("ALL PLAYRES : ", allPlayers);
    if (selectedCards.length === 0) {
      toast.warn("Sélectionne au moins une carte");
      return;
    }

    if (!socket?.connected) {
      toast.error("Socket non connecté");
      return;
    }

    socket.emit("playCard", {
      roomId,
      userId: currentUser.uid,
      cardIds: selectedCards,
    });
  }

  function takePile() {
    if (!socket?.connected) {
      toast.error("Socket non connecté");
      return;
    }

    socket.emit("takePile", {
      roomId,
      userId: currentUser.uid,
    })
  }

  function renderDiscardPile() {
    if (discardPileCard.length === 0) {
      return <p>Pas de carte dans la pile</p>;
    }
    if (!seeDiscardPile) {
      const topCardId = discardPileCard[discardPileCard.length - 1];
      const id = String(topCardId).padStart(2, "0");
      const cardLink = `https://tda-1.onrender.com/card/${id}_theme1.png`;

      return (
        <div key={`hidden-${topCardId}`}>
          <img src={cardLink} alt={`Carte ${id}`} />
        </div>
      );
    }

    if (seeDiscardPile) {
      console.log("what");
      return discardPileCard.map((cardId, index) => {
        const id = String(cardId).padStart(2, "0");
        const cardLink = `https://tda-1.onrender.com/card/${id}_theme1.png`;
        const numberOfCards = discardPileCard.length;
        const weight = 2.9;
        const center = (numberOfCards - 1) / 2;
        const angle = (index - center) * 1.5;
        const offset = index < Math.round(numberOfCards / 2)
          ? -weight * (index + 1)
          : -weight * (numberOfCards - index);
  
        return (
          <div key={`${cardId}-${index}`}>
            <img
              src={cardLink}
              alt={`Carte ${id}`}
              style={
                {
                  ["--card-transform" as string]: `translateY(${offset}px) rotate(${angle}deg)`,
                } as CSSProperties
              }
            />
          </div>
        );
      });
    }

  }

  function moveImg() {
    if (numberOfTurn * -20 > -150) {
      console.log("IMAGE DEPASSE");
    }
    return numberOfTurn * -20
  }



  return (
    <>

    <div className="game-container">

      <header>
        <section className="gameInfo">
          <h4>Infos live socket</h4>
          <p>Socket : {socket?.connected ? "connecté" : "déconnecté"}</p>
          <p>Phase : {phase || "inconnue"}</p>
          <p>Tour : {numberOfTurn}</p>
          <p>Deck : {deckLength} cartes</p>
          <p>Joueur courant : {currentPlayerId ?? "aucun"}</p>
        </section>

        <section className="players">
          {allPlayers.length === 0 ? (
          <p>il n'y a pas de player dans la room donc comment tu vois ce message ????</p>
          ) : (
            allPlayers.map((player, index) => (
              <div className={`
                playerInfo
                ${user?.uid === player.id ? "selfPlayer" : ""}
                ${currentPlayerId === player.id ? "activePlayer" : ""}
              `}
              key={player.id} id={player.id}> 
                <h3>{player.name}
                  {index === 0 && " [HOST]"}
                </h3>
                <h5> {player.hand.length ? player.hand.length + " cartes restantes" : ""}  </h5> 
                {/* // tkt marche quand meme */}
              </div>
            )))}
        </section>
        
      </header>
          
      {
        phase === "waiting" ? (
          <>
          <Wainting 
          currentUser={currentUser}
          isHost={isHost}
          startGame={startGame}
          roomId={roomId}    
          />
          
        {/* <LeaveRoomButton roomId={roomId} playerId={currentUser.uid} /> */}
          </>
        
        
        ) : (

            
           
      <>

<div className="gameBackground">

<div
  className="backgroundWrapper"
  style={{
  transform: `translateY(${numberOfTurn * 14}px)`
}}
>
  <img src="/mc.jpg" className="backgroundImg" />
</div>

  {/* reste de ton interface ici */}




          <div className="cardContainer">
            <div style={{ display: "flex", flexDirection: "column"}}>
              <div style={{display:"flex", flexDirection: "row"}}>
                <Card
                  enginePlayerHand={playerHand}
                  selectedCard={selectedCards}
                  setSelectedCard={setSelectedCard}
                />
              </div>
              <button onClick={playSelectedCards} style={{zIndex:"5"}}>PLAY</button>
              <button onClick={takePile} style={{zIndex:"5"}}>Prendre la pile</button>
              <button onClick={() => setSeeDiscardPile((value) => !value)} style={{zIndex:"5"}}>
              {seeDiscardPile ? "Masquer pile" : "Afficher pile"}
              </button>
            </div>
          </div>



        <Pile
        discardPileLength={discardPileCard.length} 
        isActive={seeDiscardPile} 
        discardPileCard={discardPileCard} 
        />

        {/* <h5>
          Bienvenue : {currentUser.uid} / {currentUser.displayName} / {currentUser.email}
        </h5> */}

        <LeaveRoomButton roomId={roomId} playerId={currentUser.uid} />

        <div className="backgroundImgContainer">
        
        </div>
      </div>
      </>
      



          )
      }
      

    </div>

    </>
  );
}

export default Game;
