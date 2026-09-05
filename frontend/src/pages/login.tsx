import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from '../firebase';
import { toast } from "react-toastify";
import { ensureUserProfile } from "../utils/userProfile";


function Login() {
  const [authMethod, setAuthMethod] = useState<"email" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Connexion réussie", {
        position: "top-center",
      });
      navigate("/user");
    } catch (error) {
      const message =
        error instanceof FirebaseError
          ? error.message
          : "Impossible de se connecter.";
      toast.error(message, {
        position: "bottom-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await ensureUserProfile(result.user, result.user.displayName);
      toast.success("Connexion Google réussie", {
        position: "top-center",
      });
      navigate("/user");
    } catch (error) {
      const message =
        error instanceof FirebaseError
          ? error.message
          : "Impossible de se connecter avec Google.";
      toast.error(message, {
        position: "bottom-center",
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <main className="auth-page auth-page-login">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h3>Connexion</h3>

        {!authMethod ? (
          <>
            <p>Choisis ta méthode de connexion.</p>
            <div className="d-grid gap-2">
              <button
                type="button"
                className="auth-action-btn auth-action-btn-login"
                onClick={() => setAuthMethod("email")}
              >
                Se connecter avec un email
              </button>
              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting}
              >
                <span className="auth-google-btn-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" focusable="false">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.655 32.659 29.302 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.964 3.036l5.657-5.657C34.432 6.053 29.467 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.964 3.036l5.657-5.657C34.432 6.053 29.467 4 24 4c-7.682 0-14.35 4.337-17.694 10.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.37 0 10.248-2.054 13.962-5.392l-6.447-5.444C29.458 34.982 26.938 36 24 36c-5.281 0-9.623-3.317-11.285-7.946l-6.523 5.025C9.502 39.556 16.037 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.1 12.1 0 0 1-4.784 6.165l.008-.006 6.447 5.444C36.508 38.601 40 32.5 40 24c0-1.341-.138-2.651-.389-3.917z"/>
                  </svg>
                </span>
                <span>{isGoogleSubmitting ? "Connexion..." : "Se connecter avec Google"}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-3">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="login-password">Mot de passe</label>
              <input
                id="login-password"
                type="password"
                className="form-control"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="d-grid gap-2">
              <button type="submit" className="auth-action-btn auth-action-btn-login" disabled={isSubmitting}>
                {isSubmitting ? "Connexion..." : "Se connecter"}
              </button>
              <button
                type="button"
                className="auth-action-btn auth-action-btn-login"
                onClick={() => setAuthMethod(null)}
              >
                Retour
              </button>
            </div>
          </>
        )}
        <p className="forgot-password text-right">
          Nouveau joueur ? <Link to="/register">Créer un compte</Link>
        </p>
      </form>
    </main>
  );
}

export default Login;
    
