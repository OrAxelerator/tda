import { leaveRoom } from '../api/room';
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

export   function LeaveRoomButton({ roomId, playerId } ) { // : {string, string}
    
    const navigate = useNavigate();

    async function handleLeaveRoom() {
    if (!roomId) return;

    try {

    console.log("--------------------------------- LEAVE ROOM ---------------------------------");

    console.log(roomId);
    console.log(playerId);

        const data = await leaveRoom(roomId, playerId);

        console.log(data);


        // socket.emit("leaveRoom", {
        //     roomId,
        //     playerId
        // });

        navigate("/")

    } catch (err) {

        console.error(err);

    }
}

    return (
    <button onClick={handleLeaveRoom}>
        Quitter la partie
    </button>
    )
}