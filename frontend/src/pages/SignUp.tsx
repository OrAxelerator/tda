import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import { ensureUserProfile } from "../utils/userProfile";

export interface UserProfile {
  uid: string;
  displayName: string;
  cardStyle: string;
  gamesPlayed: number;
  gamesWon: number;
  profileBanner: string;
  profileImageUrl: string | null;
}

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserProfile(user, name);
      toast.success("Compte créé avec succès", {
        position: "top-center",
      });
      navigate("/user");
    } catch (error) {
      const message =
        error instanceof FirebaseError
          ? error.message
          : "Impossible de créer le compte.";
      toast.error(message, {
        position: "bottom-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page auth-page-register">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h3>Créer un compte</h3>

      <div className="mb-3">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          className="form-control"
          placeholder="email@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="register-password">Mot de passe</label>
        <input
          id="register-password"
          type="password"
          className="form-control"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="register-name">Pseudo in game</label>
        <input
          id="register-name"
          type="text"
          className="form-control"
          placeholder="Pseudo in game"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

        <div className="d-grid">
          <button type="submit" className="auth-action-btn auth-action-btn-register" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer un compte"}
          </button>
        </div>

        <p className="forgot-password text-right">
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </form>
    </main>
  );
}

export default SignUp;
