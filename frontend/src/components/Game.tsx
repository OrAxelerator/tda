import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { toast } from "react-toastify";
import Card from "./Card";
import { LeaveRoomButton } from "./LeaveRoomButton";
import { useAuth } from "../components/auth-context";
import "../App.css";
import "../game.css";
import Waiting from "./Waiting";
// import { getDataConnect } from "firebase/data-connect";
import Pile from "./Pile";

import { API_URL, apiUrl, readJsonResponse } from "../config";
import type { Key } from "readline";

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


type PublicPlayer = {
  id: string;
  name: string;
  isHost: boolean;
  isWinner: boolean;
  cardCount: number;
}

type GameUpdatePayload = {
  roomId: string;
  discardCard: number[];
  deckLength: number;
  yourCard: any[];
  numberOfTurn: number;
  currentPlayerId: string | null;
  phase: string;
  state?: {
    players: RoomPlayer[];
  };
  publicPlayer: PublicPlayer[];
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
  const [publicPlayers, setPublicPlayers] = useState<PublicPlayer[]>([]);
  const [allPlayers, setAllPlayers] = useState<RoomPlayer[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [debugFonc, setDebug] = useState<any>()


  useEffect(() => {
    if (!user || !roomId) {
      return;
    }

    const newSocket = io(API_URL, {
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
      setNumberOfTurn(payload.numberOfTurn ?? 0);
      setCurrentPlayerId(payload.currentPlayerId ?? null);
      setPhase(payload.phase ?? "");
      setAllPlayers(payload.state?.players ?? []);
      setPublicPlayers(payload.publicPlayer)
      setDebug(payload.state?.players)

      const currentUser = payload.state?.players?.find(
        (player) => player.id === user.uid,
      );
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
  const currentTurnPlayer = publicPlayers.find((player) => player.id === currentPlayerId);

  function getPlayerAvatar(player: PublicPlayer) {
    if (player.id === user?.uid && user.photoURL) {
      return user.photoURL;
    }

    return "/default.jpeg";
  }

  async function startGame() {
    try {
      const res = await fetch(apiUrl(`/rooms/${roomId}/startGame`), {
        method: "POST",
      });
      const data = await readJsonResponse(res);

      if (!res.ok || !data?.success) {
        toast.error(data.message || "Impossible de lancer la partie");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur pendant le lancement de la partie");
    }
  }

  function playSelectedCards() {
    console.log("play card : ");
    console.log(selectedCards.length);
    console.log(selectedCards);
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
    });
  }

  function debug() {

    console.log("------debug ---------");

    console.log("debug");
    console.log(debugFonc);
    
    console.log("P-Player");
    console.log(publicPlayers);



    console.log("----------");
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        console.log("ENTER");
        playSelectedCards();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCards]);

  return (
    <>
      <div className="game-container">
        <header className="Appheader">
          <section className="gameInfo">
            <h4>Partie</h4>
            <p>
              <strong>Vous :</strong> {user.displayName || user.email || "Joueur"}
            </p>
            <p>
              <strong>Tour de :</strong> {currentTurnPlayer?.name || "aucun"}
            </p>
            <p>
              <strong>Phase :</strong> {phase || "inconnue"}
            </p>
            <p>
              <strong>Tour :</strong> {numberOfTurn}
            </p>
            <p>
              <strong>Deck :</strong> {deckLength} cartes
            </p>
            <p>
              <strong>Socket :</strong> {socket?.connected ? "connecté" : "déconnecté"}
            </p>
          </section>

          <section className="players">
            {allPlayers.length === 0 ? (
              <p>
                il n'y a pas de player dans la room donc comment tu vois ce
                message ????
              </p>
            ) : (
              publicPlayers.map((player) => (
                <div
                  className={`
                    playerInfo
                    ${user?.uid === player.id ? "selfPlayer" : ""}
                    ${currentPlayerId === player.id ? "activePlayer" : ""}
                  `}
                  key={player.id}
                  id={player.id}
                >
                  <div className="playerBadges">
                    {user?.uid === player.id && <span className="playerBadge self">Vous</span>}
                    {currentPlayerId === player.id && <span className="playerBadge turn">Tour</span>}
                  </div>

                  <img
                    src={getPlayerAvatar(player)}
                    alt={player.name}
                    className="playerAvatar"
                    onError={(event) => {
                      event.currentTarget.src = "/default.jpeg";
                    }}
                  />
                  <h3>
                    <span>{player.name}</span>
                    {player.isHost && <span>[HOST]</span>}
                  </h3>
                  <h5>
                    {player.cardCount ? `${player.cardCount} cartes restantes` : ""}
                  </h5>
                </div>
              ))
            )}
          </section>
        </header>
          
      {
        phase === "waiting" ? (
          <>
          <Waiting 
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
              <img src="/mc.jpeg" className="backgroundImg" />
            </div>





          <div className="cardContainer">
            <div className="cardActionsPanel">
              <div className="handScroll">
                <div className="handTrack">
                  <Card
                    enginePlayerHand={playerHand}
                    selectedCard={selectedCards}
                    setSelectedCard={setSelectedCard}
                  />
                </div>
              </div>

              <div className="handActions">
                <button onClick={playSelectedCards} style={{zIndex:"5"}}>PLAY</button>
                <button onClick={takePile} style={{zIndex:"5"}}>Prendre la pile</button>
                {
                  isHost ? <button onClick={debug} style={{zIndex:"5"}}>GET STATE ROOT</button> : null
                }
                <button onClick={() => setSeeDiscardPile((value) => !value)} style={{zIndex:"5"}}>
                  {seeDiscardPile ? "Masquer pile" : "Afficher pile"}
                </button>
              </div>
            </div>
          </div>



        <Pile
        discardPileLength={discardPileCard.length} 
        isActive={seeDiscardPile} 
        discardPileCard={discardPileCard} 
        />


        <LeaveRoomButton roomId={roomId} playerId={currentUser.uid} />

        {
          (phase == "finished" && isHost ) ? <button onClick={startGame}> RELANCER PARTIE</button> : null
        }
        

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
