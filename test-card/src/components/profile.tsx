
import { FirebaseError } from "firebase/app";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { db } from "./firebase";
import { useAuth } from "./useAuth";

function generateRoomCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint32Array(length);

  crypto.getRandomValues(values);

  return Array.from(values, (value) => chars[value % chars.length]).join("");
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!user) return;

    const roomCode = generateRoomCode();
    setIsCreatingRoom(true);

    try {
      await setDoc(doc(db, "rooms", roomCode), {
        code: roomCode,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        creatorEmail: user.email,
        creatorName: user.displayName || user.email || "Joueur",
      });

      navigate(`/game/${roomCode}`);
    } catch (error) {
      const message =
        error instanceof FirebaseError
          ? error.message
          : "Impossible de créer la room.";
      toast.error(message, {
        position: "bottom-center",
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      const message =
        error instanceof FirebaseError
          ? error.message
          : "Impossible de se déconnecter.";
      toast.error(message, {
        position: "bottom-center",
      });
    }
  };

  return (
    <section className="user-page">
      <div>
        <h2>Bienvenue{user?.displayName ? `, ${user.displayName}` : ""}</h2>
        <p>{user?.email}</p>
      </div>

      <div className="user-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCreateRoom}
          disabled={isCreatingRoom}
        >
          {isCreatingRoom ? "Création..." : "Créer une room"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>
    </section>
  );
}
