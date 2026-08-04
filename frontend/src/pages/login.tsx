import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from '../firebase';
import { toast } from "react-toastify";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  return (
    <form onSubmit={handleSubmit}>
      <h3>Connexion</h3>

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

      <div className="d-grid">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </button>
      </div>
      <p className="forgot-password text-right">
        Nouveau joueur ? <Link to="/register">Créer un compte</Link>
      </p>
    </form>
  );
}

export default Login;
    