import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/auth-context";
import { apiUrl, readJsonResponse } from "../../config";



export default function PlayMenu() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

        const [roomId, setRoomId] = useState("");


    async function joinGame() {
  if (!user) {
    setErrorMessage("Utilisateur non connecté");
    return;
  }

  setIsLoading(true);
  setErrorMessage(null);

  try {
    const res = await fetch(apiUrl(`/rooms/${roomId}/joinGame`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerId: user.uid,
        playerName: user?.email,
      }),
    });

    const data = await readJsonResponse(res);
    console.log(data);

    if (!res.ok || !data?.success) {
      throw new Error(data?.message || "Impossible de rejoindre la partie");
    }

    navigate(`/game/${roomId}`);
  } catch (err: any) {
    console.error(err);
    setErrorMessage(err?.message ?? "Erreur inconnue lors de la connexion à la room.");
  } finally {
    setIsLoading(false);
  }
}



    return (


        <>
            <h1 style={{color:"black"}}>Rejoindre une partie : </h1>

            <div className="playInput">
                <input
                type="text"
                placeholder="Code de la room"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="playInputCode"
                />

                <button onClick={joinGame} className="playBtn" disabled={isLoading}>
                <h3>{isLoading ? "Connexion..." : "Rejoindre"}</h3>
                </button>
            </div>
            

      {errorMessage ? (
        <p style={{ color: "red", marginTop: "1rem" }}>{errorMessage}</p>
      ) : null}



        
        </>
    )
}
