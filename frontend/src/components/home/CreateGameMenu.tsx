import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/auth-context";
import { apiUrl, readJsonResponse } from "../../config";

export default function CreateGameMenu() {
    const { user } = useAuth(); // pas besoin de logout ? hmm
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

    let step = "récupération du token Firebase";

    try {
      const idToken = await user.getIdToken();

      step = "appel du backend";
      console.log("[createGame] appel");
      const response = await fetch(apiUrl("/api/createGame"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid: user.uid, bots: botsNumber }),
      });
      console.log("[createGame] réponse", response.status);

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
      console.error(`Erreur création room pendant ${step} :`, err);
      setErrorMessage(err?.message ?? `Erreur pendant ${step}.`);
    } finally {
      setIsLoading(false);
    }
  };

    return (


        <>
           <h1 style={{color:"white"}}>Créer une partie : </h1>


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
                />

            <div style={{ marginTop: "1rem" }}>
                <button type="button" onClick={handleClick} disabled={isLoading} className="createGameBtnInput">
                    {isLoading ? "Création en cours..." : "Créer une Room"}
                </button>
            </div>

            

            {errorMessage ? (
        <p style={{ color: "red", marginTop: "1rem" }}>{errorMessage}</p>
      ) : null}
        
        </>
    )
}
