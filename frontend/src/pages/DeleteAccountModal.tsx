import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { doc, deleteDoc } from "firebase/firestore";
import {
  getAuth,
  deleteUser,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { toast } from "react-toastify";

import { db } from "../firebase-db";

interface DeleteAccountModalProps {
  onClose: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Mot de passe incorrect.";
      case "auth/too-many-requests":
        return "Trop de tentatives, réessaie dans quelques minutes.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Fenêtre Google fermée, suppression annulée.";
      case "auth/user-mismatch":
        return "Ce compte Google ne correspond pas à ton compte TDA.";
    }
  }

  return "Impossible de supprimer le compte. Réessaie plus tard.";
}

export default function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const navigate = useNavigate();
  const currentUser = getAuth().currentUser;
  const usesPassword =
    currentUser?.providerData.some((p) => p.providerId === "password") ?? false;

  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, onClose]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;

    if (usesPassword && !password) {
      setError("Entre ton mot de passe pour confirmer.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      // Firebase exige une connexion récente avant deleteUser
      if (usesPassword) {
        if (!currentUser.email) throw new Error("Compte sans e-mail");
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      } else {
        await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
      }

      await deleteDoc(doc(db, "users", currentUser.uid));
      await deleteUser(currentUser);

      toast.success("Ton compte a bien été supprimé.");
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Erreur suppression du compte :", err);
      setError(getErrorMessage(err));
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={() => !isDeleting && onClose()}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="delete-account-title">Supprimer mon compte</h2>
        <p>
          Cette action est <strong>définitive</strong> : ton profil, tes statistiques
          et tes succès seront perdus.
        </p>

        {usesPassword ? (
          <label className="modal-field">
            <span>Mot de passe</span>
            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isDeleting}
            />
          </label>
        ) : (
          <p className="modal-hint">
            Une fenêtre Google va s'ouvrir pour confirmer ton identité.
          </p>
        )}

        {error ? <p className="modal-error">{error}</p> : null}

        <div className="modal-actions">
          <button
            type="button"
            className="profile-btn profile-btn-ghost"
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="profile-btn profile-btn-danger"
            disabled={isDeleting}
          >
            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
