import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import type { User } from "firebase/auth";
interface waitingProps {
  isHost:boolean;
  roomId:string;
  currentUser:User;
  startGame: () => void;
}

export default function Waiting({ currentUser, isHost, startGame, roomId} : waitingProps) {
  const [copied, setCopied] = useState(false);

  // Remet le bouton dans son état normal après 2 s
  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyRoomId = async () => {
    try {
      // navigator.clipboard n'existe qu'en contexte sécurisé (https ou localhost)
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast.success("Code de la room copié dans le presse-papier");
    } catch (err) {
      console.error("Copie impossible :", err);
      toast.error("Impossible de copier le code, sélectionne-le à la main.");
    }
  };

    return (
        <div className="waiting">
        <h1>En attente des joueurs...</h1>

        <h5>
          Bienvenue {currentUser.displayName || currentUser.email || "Joueur"}
        </h5>

        <p className="roomIdLabel">Code de la room à partager :</p>
        <button
          type="button"
          className={`roomIdContainer ${copied ? "isCopied" : ""}`}
          onClick={copyRoomId}
          title="Copier le code de la room"
          aria-label={copied ? "Code copié" : `Copier le code ${roomId}`}
        >
          <span className="icon" aria-hidden="true">
            <i className={copied ? "nf nf-fa-check" : "nf nf-fa-copy"}></i>
          </span>
          <span className="roomdId">{roomId}</span>
        </button>

        {isHost ? (
          <>
            <h5>Vous êtes l'hôte de la partie</h5>
            <button onClick={startGame} className="startGameBtn">Lancer la partie</button>
          </>
        ) : (
          <h5>En attente du lancement par l'hôte</h5>
        )}
        </div>
    )
}
