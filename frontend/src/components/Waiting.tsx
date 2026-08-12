import { LeaveRoomButton } from "./LeaveRoomButton"



export default function Wainting({ currentUser, isHost, startGame, roomId}) {

    return (
        <>
        <h1>Waiting ...</h1> 

        <h5>
          Bienvenue : {currentUser.uid} / {currentUser.displayName} / {currentUser.email}
        </h5>

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