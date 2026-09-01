import { leaveRoom } from '../api/room';
import { useNavigate } from "react-router-dom";

export function LeaveRoomButton({ roomId, playerId } : { roomId:string, playerId: string } )  { // : {string, string} todo
    
    const navigate = useNavigate();

    async function handleLeaveRoom() {
    if (!roomId) {
        navigate("/");
        return;
    }

    try {
        await leaveRoom(roomId, playerId);
    } catch (err) {
        console.error(err);
    } finally {
        navigate("/");
    }
}

    return (
    <button onClick={handleLeaveRoom}>
        Quitter la partie
    </button>
    )
}
