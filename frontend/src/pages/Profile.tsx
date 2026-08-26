import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../components/auth-context";
import { db } from "../firebase";

export type UserProfileData = {
  uid: string;
  displayName: string;
  cardStyle: string;
  gamesPlayed: number;
  gamesWon: number;
  profileBanner: string;
  profileImageUrl: string | null;
};

function Profile() {
  const { uid } = useParams<{ uid: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !uid || uid === user?.uid;

  useEffect(() => {
    const profileUid = uid ?? user?.uid;

    if (!profileUid) {
      setError("Aucun profil disponible.");
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const snapshot = await getDoc(doc(db, "user", profileUid));
        if (!snapshot.exists()) {
          setError("Utilisateur introuvable.");
          return;
        }

        setProfile(snapshot.data() as UserProfileData);
      } catch {
        setError("Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [uid, user?.uid]);

  function handleClick() {
    navigate("/home");
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (error) {
    return (
      <div>
        <h1>Profil</h1>
        <p>{error}</p>
        <button onClick={handleClick}>Retour</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Profil {isOwnProfile ? "personnel" : "joueur"}</h1>
      <pre>{JSON.stringify(profile, null, 2)}</pre>
      <p>Connecté en tant que : {user?.email ?? "Utilisateur inconnu"}</p>
      {isOwnProfile ? (
        <button className="btn btn-secondary" onClick={() => logout()}>
          Déconnexion
        </button>
      ) : (
        <button onClick={() => navigate("/user")}>Mon profil</button>
      )}
      <button onClick={handleClick}>Retour Home</button>
    </div>
  );
}

export default Profile;
