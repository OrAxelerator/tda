import { toast } from "react-toastify";
import { LeaveRoomButton } from "./LeaveRoomButton"



export default function Wainting({ currentUser, isHost, startGame, roomId}) {


  const handleClick = (param:string) => {
    switch (param) {
      case "roomId": 
        navigator.clipboard.writeText(roomId);
        toast.success("Code de la room copié dans le presse papier");
        break;
      case "roomLink":
        navigator.clipboard.writeText(`https://tda/game/${roomId}`);
        toast.success("Lien de la room copié dans le presse papier");
        break;
      default:
        navigator.clipboard.writeText(roomId);
        toast.success("Code de la room copié dans le presse papier");
        break;
    }
  }




    return (
        <>
        <h1>Waiting ...</h1> 

        <h5>
          Bienvenue : {currentUser.uid} / {currentUser.displayName} / {currentUser.email}
        </h5>

        <div className="roomIdContainer" onClick={() => handleClick("roomId")}>
          <div className="icon">
            <i className="nf nf-fa-copy"></i>
          </div>
          <p className="roomdId">{roomId}</p>
        </div>

        <div className="roomIdContainer" onClick={() => handleClick("roomLink ")}>
          <div className="icon">
            <i className="nf nf-fa-copy"></i>
          </div>
          <p className="roomdId">{"https://tda/game/"+roomId}</p>
        </div>


        {isHost ? (
          <>
            <h5>Vous êtes l'hôte de la partie</h5>
            <button onClick={startGame}>START GAME</button>
          </>
        ) : (
          <h5>Vous êtes un joueur</h5>
        )}

        <LeaveRoomButton roomId={roomId} playerId={currentUser.uid} />
        </>
    )
}