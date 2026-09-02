import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/auth-context";
import { apiUrl, readJsonResponse } from "../../config";

export default function CreateGameMenu() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [botsNumber, setBotsNumber] = useState("")


    const handleClick = async () => {
    if (!user) {
      setErrorMessage("Utilisateur non connecté");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch(apiUrl("/api/createGame"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid: user.uid, bots: botsNumber }),
      });
      console.log(botsNumber); // yes

      const data = await readJsonResponse(response);

      if (!response.ok) {
        const errorBody = data ?? {};
        const message = errorBody.message || "Impossible de créer la room";
        throw new Error(`${response.status} ${response.statusText}: ${message}`);
      }

      console.log("Room créée côté backend :", data);

      if (data?.roomId) {
        navigate(`/game/${data.roomId}`);
      } else {
        setErrorMessage("Room créée mais aucun ID retourné.");
      }
    } catch (err: any) {
      console.error("Erreur création room :", err);
      setErrorMessage(err?.message ?? "Erreur inconnue lors de la création de la room.");
    } finally {
      setIsLoading(false);
    }
  };

    return (


        <>
           <h1 style={{color:"black"}}>Créer une partie : </h1>


                <input
                type="number"
                placeholder="Nombre de bot"
                autoFocus
                  onKeyDown={(e) => {
                      if (e.key === "Enter") {
                          handleClick()
                      }
                  }}
                value={botsNumber}
                onChange={(e) => setBotsNumber(e.target.value)}
                className="menuInputBot"
                max={5}
                min={0}
                defaultValue={0}
                
                />

            <div style={{ marginTop: "1rem" }}>
                <button onClick={handleClick} disabled={isLoading}>
                    {isLoading ? "Création en cours..." : "Créer THE game"}
                </button>
            </div>

            

            {errorMessage ? (
        <p style={{ color: "red", marginTop: "1rem" }}>{errorMessage}</p>
      ) : null}
        
        </>
    )
}
