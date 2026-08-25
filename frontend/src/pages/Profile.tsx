
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/auth-context";

function Profile() {
  const { user, logout } = useAuth();
      const navigate = useNavigate();

  function handleClick() {
    navigate("/home")
  }

  return (
    <>
      <div>
        <h1>Profil</h1>
        <p>Connecté en tant que : {user?.email ?? "Utilisateur inconnu"}</p>
        <button className="btn btn-secondary" onClick={() => logout()}>
          Déconnexion
        </button>

        <button onClick={handleClick}>
          Retrun Home
        </button>
      </div>

    </>
  );
}

export default Profile;
