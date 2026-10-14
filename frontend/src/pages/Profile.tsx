import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "../components/auth-context";
import { db } from "../firebase-db";
import type { UserProfile } from "../types/userProfile";
import { ACHIEVEMENTS } from "../data/achievements";
import DeleteAccountModal from "./DeleteAccountModal";
import "./profile.css";

function Profile() {
  const { uid } = useParams<{ uid: string }>();
  const { user, logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !uid || uid === user?.uid;
  console.log("isOwnProfile:", isOwnProfile);
  const wins = profile?.gamesWon ?? 0;
  // Les anciens docs users n'ont pas forcément ces champs
  const unlockedAchievements = profile?.achievements ?? [];
  const roles = profile?.role ?? [];
  const totalAchievements = Object.keys(ACHIEVEMENTS).length;
  // Façon Steam : on affiche les succès débloqués, les autres restent masqués
  const unlockedIds = unlockedAchievements.filter((id, index, list) => list.indexOf(id) === index);
  const lockedIds = Object.keys(ACHIEVEMENTS).filter((id) => !unlockedIds.includes(id));
  const unlockedInCatalog = unlockedIds.filter((id) => id in ACHIEVEMENTS).length;
  const progress = totalAchievements ? Math.round((unlockedInCatalog / totalAchievements) * 100) : 0;

  useEffect(() => {
    const profileUid = uid ?? user?.uid;

    if (!profileUid) {
      return;
    }

    const loadProfile = async () => {
      try {
        console.log("avant ")
        console.log("profileUid:", profileUid);
        const snapshot = await getDoc(doc(db, "users", profileUid));
        console.log("Snapshot:", snapshot);
        if (!snapshot.exists()) {
          setError("Utilisateur introuvable.");
          return;
        }

        setProfile(snapshot.data() as UserProfile);
        console.log("Profile loaded:", snapshot.data());  
      } catch (err) {
        console.error("Erreur lors du chargement du profil :", err);
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
      return "/default_banner.jpeg";
    }

    return banner;
  }

  function getProfileImage() {
    return profile?.profileImageUrl || "/profil.jpeg";
  }

  function getDisplayName() {
    return profile?.displayName ?? "Joueur";
  }

  if (!uid && !user?.uid) {
    return (
      <div>
        <h1>Profil</h1>
        <p>Aucun profil disponible.</p>
        <button onClick={handleClick}>Retour</button>
      </div>
    );
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
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => logout()}
        >
          Déconnexion
        </button>
      </div>
    );
  }

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

          <div className="container-role">
            {
              roles.map((el, index) => 
              <div key={index} className="profile-role">
                <p>{el}</p>
              </div>
              )
            }
          </div>
        </div>

        <div className="profile-stats">
          <article className="profile-stat">
            <span>Victoires</span>
            <strong>{wins}</strong>
          </article>
          <article className="profile-stat">
            <span>Succès</span>
            <strong>
              {unlockedInCatalog} / {totalAchievements}
            </strong>
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
          <button
            type="button"
            className="profile-btn profile-btn-ghost"
            onClick={handleClick}
          >
            <i className="nf nf-fa-arrow_left" aria-hidden="true"></i>
            Retour
          </button>

          {isOwnProfile ? (
            <div className="profile-footer-group">
              <button
                type="button"
                className="profile-btn profile-btn-secondary"
                onClick={() => logout()}
              >
                <i className="nf nf-fa-sign_out" aria-hidden="true"></i>
                Déconnexion
              </button>
              <button
                type="button"
                className="profile-btn profile-btn-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <i className="nf nf-fa-trash" aria-hidden="true"></i>
                Supprimer mon compte
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="profile-btn profile-btn-secondary"
              onClick={() => navigate("/user")}
            >
              <i className="nf nf-fa-user" aria-hidden="true"></i>
              Mon profil
            </button>
          )}
        </div>

        <section className="profile-achievements">
          <div className="achievements-header">
            <h2>Succès</h2>
            <span>{unlockedInCatalog} / {totalAchievements} débloqués ({progress}%)</span>
          </div>
          <div className="achievements-progress" aria-hidden="true">
            <div style={{ width: `${progress}%` }} />
          </div>

          {unlockedIds.length === 0 ? (
            <p className="achievements-empty">Aucun succès débloqué pour le moment.</p>
          ) : (
            <div className="profile-achivement">
              {unlockedIds.map((id) => {
                const info = ACHIEVEMENTS[id];
                return (
                  <article key={id} className="achivement isUnlocked">
                    <div className="achivement-icon" aria-hidden="true">
                      <i className={`nf ${info?.icon ?? "nf-fa-question"}`}></i>
                    </div>
                    <div className="achivement-text">
                      <strong>{info?.name ?? id}</strong>
                      <p>{info?.description ?? "Succès inconnu"}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {lockedIds.length > 0 ? (
            <>
              <button
                type="button"
                className="achievements-toggle"
                onClick={() => setShowLocked((value) => !value)}
                aria-expanded={showLocked}
              >
                <i className="nf nf-fa-lock" aria-hidden="true"></i>
                {showLocked
                  ? "Masquer les succès verrouillés"
                  : `${lockedIds.length} succès verrouillé${lockedIds.length > 1 ? "s" : ""} restant${lockedIds.length > 1 ? "s" : ""}`}
                <i
                  className={`nf ${showLocked ? "nf-fa-chevron_up" : "nf-fa-chevron_down"}`}
                  aria-hidden="true"
                ></i>
              </button>

              {showLocked ? (
                <div className="profile-achivement">
                  {lockedIds.map((id) => (
                    <article key={id} className="achivement isLocked">
                      <div className="achivement-icon" aria-hidden="true">
                        <i className="nf nf-fa-lock"></i>
                      </div>
                      <div className="achivement-text">
                        <strong>{ACHIEVEMENTS[id].name}</strong>
                        <p>{ACHIEVEMENTS[id].description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </section>

      {showDeleteModal ? (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      ) : null}
    </div>
  );
}

export default Profile;
