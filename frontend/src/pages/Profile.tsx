import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import {
  getAuth,
  deleteUser,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

import { useAuth } from "../components/auth-context";
import { db } from "../firebase";
import type { UserProfile } from "../types/userProfile";
import "./profile.css";
import { toast } from "react-toastify";

function Profile() {
  const { uid } = useParams<{ uid: string }>();
  const { user, logout } = useAuth();
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !uid || uid === user?.uid;
  console.log("isOwnProfile:", isOwnProfile);
  const wins = profile?.gamesWon ?? 0;
  const losses = Math.max((profile?.gamesPlayed ?? 0) - wins, 0);

  const auth = getAuth();
  console.log(auth);

  useEffect(() => {
    const profileUid = uid ?? user?.uid;

    if (!profileUid) {
      setError("Aucun profil disponible.");
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        console.log("avant ")
        console.log("profileUid:", profileUid);
        const snapshot = await getDoc(doc(db, "user", profileUid));
        console.log("Snapshot:", snapshot);
        if (!snapshot.exists()) {
          setError("Utilisateur introuvable.");
          return;
        }

        setProfile(snapshot.data() as UserProfile);
        console.log("Profile loaded:", snapshot.data());  
      } catch {
        console.error("Erreur lors du chargement du profil :", error);
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

  function getBanner() {
    const banner = profile?.profileBanner;
    if (!banner || banner === "default") {
      return "/default.jpeg";
    }

    return banner;
  }

  function getProfileImage() {
    return profile?.profileImageUrl || "/default.jpeg";
  }

  function getDisplayName() {
    return profile?.displayName ?? "Joueur";
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

  const deleteSignedUser = async () => {
    if (!password) {
      toast.error("Vous devez écrire votre mot de passe dans l'input a droite du btn suprimer compte");
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const providerId = currentUser.providerData[0]?.providerId;

    try {
      if (providerId === "password") {
        console.log("Réauthentification Email");

        try {
          if (!currentUser.email) return;
          // Création des credentials
          const credential = EmailAuthProvider.credential(
            currentUser.email,
            password,
          );

          // Réauthentification
          await reauthenticateWithCredential(currentUser, credential);

          console.log("-------");
          console.log(currentUser.uid);
          console.log(db);
          console.log("------");
          // 1. Supprime les données Firestore
          await deleteDoc(doc(db, "user", currentUser.uid));
          
          console.log("Document Firestore supprimé");

          // Suppression
          await deleteUser(currentUser);
          navigate("/home"); // doesn't work ... go to login page instead why

          console.log("Compte supprimé");
        } catch (error) {
          console.error("Erreur suppression :", error);
        }
      }

      if (providerId === "google.com") {
        console.log("Réauthentification Google");

        const provider = new GoogleAuthProvider();

        
        await reauthenticateWithPopup(currentUser, provider);


        // 1. Supprime les données Firestore
        // await deleteDoc(doc(db, "user", "3UH5PLQ4YcR6fkUbe1Y1C9844WJ2")) // MARCHE !!

        console.log("tests passé");
          console.log("-------");
          console.log(typeof  currentUser.uid);
          console.log(db);
          console.log("------");
        await deleteDoc(doc(db, "user", currentUser.uid)); //
        
        
        await deleteUser(currentUser);
      }

    } catch (error) {
      console.error(error);
    }
  };


  return (
    <div className="profile-page">
      <div className="backgroundWrapper">
        <img
          src={getBanner()}
          className="backgroundImg"
          alt="Bannière du profil"
        />
      </div>

      <section className="containerProfil">
        <div className="profile-hero">
          <img
            src={getProfileImage()}
            alt="Avatar du profil"
            className="profile-avatar"
          />
          <div className="profile-title">
            <h1>{getDisplayName()}</h1>
          </div>
        </div>

        <div className="profile-stats">
          <article className="profile-stat">
            <span>Victoires</span>
            <strong>{wins}</strong>
          </article>
          <article className="profile-stat">
            <span>Défaites</span>
            <strong>{losses}</strong>
          </article>
          <article className="profile-stat">
            <span>Parties jouées</span>
            <strong>{profile?.gamesPlayed ?? 0}</strong>
          </article>
          <article className="profile-stat">
            <span>Style cartes</span>
            <strong>{profile?.cardStyle || "default"}</strong>
          </article>
        </div>

        {/* {isOwnProfile ? (
          <div className="profile-actions">
            <button type="button" className="btn btn-secondary" onClick={() => void 0}>
              Changer la bannière
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void 0}>
              Changer la photo
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void 0}>
              Changer le pseudo
            </button>
            </div>
            ) : null} */}

        <div className="profile-footer">
          <div className="actionBtnUser">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleClick}
          >
            Retour Home
          </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => logout()}
        >
          Déconnexion
        </button>

        <button onClick={() => deleteSignedUser()}>
          Supprimer mon compte
        </button>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
          </div>

          {!isOwnProfile ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/user")}
            >
              Mon profil
            </button>
          ) : null}


        </div>

        <div className="profile-footer">

          {/* <h2>Badges : </h2>
          <h6>en dev...</h6> */}

        </div>
      </section>
    </div>
  );
}

export default Profile;
