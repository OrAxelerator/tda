import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/auth-context";

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


    const [roomId, setRoomId] = useState("");

async function joinGame() {
  try {
    const res = await fetch("http://localhost:3000/api/joinGame", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
        playerId: user.uid,
        playerName: user?.displayName,
      }),
    });

    const data = await res.json();
    console.log(data);
    navigate(`/game/${roomId}`);
  } catch (err) {
    console.error(err);
  }
}



  const handleClick = async () => {
    if (!user) {
      setErrorMessage("Utilisateur non connecté");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch("/api/createGame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid: user.uid }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody.message || "Impossible de créer la room";
        throw new Error(`${response.status} ${response.statusText}: ${message}`);
      }

      const data = await response.json();
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
      <div>
        <h1>Profil</h1>
        <p>Connecté en tant que : {user?.email ?? "Utilisateur inconnu"}</p>
        <button className="btn btn-secondary" onClick={() => logout()}>
          Déconnexion
        </button>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={handleClick} disabled={isLoading}>
          {isLoading ? "Création en cours..." : "Créer game"}
        </button>
      </div>

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
  );
}

export default Profile;
