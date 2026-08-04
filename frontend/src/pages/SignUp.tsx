import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../firebase";
import { toast } from "react-toastify";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
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
    <form onSubmit={handleSubmit}>
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

      <div className="d-grid">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Création..." : "Créer un compte"}
        </button>
      </div>

      <p className="forgot-password text-right">
        Déjà inscrit ? <Link to="/login">Se connecter</Link>
      </p>
    </form>
  );
}

export default SignUp;
