
import { FirebaseError } from "firebase/app";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "./useAuth";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        <button type="button" className="btn btn-primary" onClick={() => navigate("/game")}>
          Lancer partie
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>
    </section>
  );
}
