import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/auth-context";



export default function PlayMenu() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

        const [roomId, setRoomId] = useState("");


    async function joinGame() {
  try {
    const res = await fetch(`http://localhost:3000/rooms/${roomId}/joinGame`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerId: user.uid,
        playerName: user?.email,
      }),
    });

    const data = await res.json();
    console.log(data);
    navigate(`/game/${roomId}`);
  } catch (err) {
    console.error(err);
  }
}



    return (


        <>
            <h4>Play menu : </h4>
            <p> idk</p>
            

            <input
            type="text"
            placeholder="Code de la room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            />

            <button onClick={joinGame}>
            Rejoindre
            </button>
            

      {errorMessage ? (
        <p style={{ color: "red", marginTop: "1rem" }}>{errorMessage}</p>
      ) : null}



        
        </>
    )
}