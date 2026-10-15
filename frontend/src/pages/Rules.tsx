import { useNavigate } from "react-router-dom";
import "./rules.css";

// Contenu repris de regle.md (racine du repo), à garder synchronisé
function Rules() {
  const navigate = useNavigate();

  return (
    <div className="rules-page">
      <section className="rules-container">
        <button
          type="button"
          className="rules-back"
          onClick={() => navigate("/home")}
        >
          <i className="nf nf-fa-arrow_left" aria-hidden="true"></i>
          Retour
        </button>

        <h1>Règles de la Tour de l'As</h1>

        <h2>Kézako ?</h2>
        <p>
          La tour de l'as (TDA) est un jeu de cartes qui se joue avec un paquet de
          54 cartes classique. On peut y jouer de 2 à 6 joueurs.
        </p>

        <h2>But du jeu</h2>
        <p>Le but du jeu est de ne plus avoir de cartes dans sa main avant les autres.</p>

        <h2>Préparation</h2>
        <p>
          Chaque joueur tient face cachée dans sa main 6 cartes, le reste des cartes
          est posé face cachée et constitue la pioche. La personne à droite de la
          pioche commence.
        </p>

        <h2>Règles</h2>

        <h3>Règle de base</h3>
        <p>
          Au premier tour, le premier joueur pose une carte de son choix face visible
          au centre de la table (qu'on appellera la tour). Le joueur suivant a 2
          choix : prendre toutes les cartes de la pile (ici une seule) ou poser une
          carte de valeur supérieure ou égale. De même pour le joueur suivant.
        </p>

        <h3>Pose des cartes</h3>
        <p>
          Si le joueur dont c'est le tour possède plusieurs cartes de la même valeur,
          il peut toutes les poser en même temps (si la tour le permet). Exemple :
          la tour est un 3 de trèfle, Martin peut poser son 5 de trèfle et son 5 de
          cœur.
        </p>
        <p>
          De plus, dans la TDA, la <strong>volée</strong> existe : à tout moment, si
          une carte de même valeur que la vôtre est en haut de la tour, vous pouvez
          poser votre carte. Cela compte comme votre tour.
        </p>

        <h3>Ordre des cartes</h3>
        <p>2 &lt; 3 &lt; … &lt; As &lt; Joker</p>

        <h3>La super tour</h3>
        <p>Sur le joker, un 2 peut être posé afin de relancer le jeu.</p>

        <h3>Fin de tour</h3>
        <p>
          Un tour se termine quand un joueur prend la pile et l'ajoute à sa main,
          faute de carte jouable ou de son plein gré. Tous les joueurs avec 1 ou 2
          cartes doivent alors repiocher pour en avoir 3.
        </p>
        <p className="rules-note">
          À noter : on ne peut pas jouer après avoir récupéré la pile, la main passe
          au joueur suivant.
        </p>

        <h2>Variantes</h2>
        <ul>
          <li>
            <strong>Joker fou</strong> : le joker peut se transformer en n'importe
            quelle carte.
          </li>
          <li>
            <strong>Le joker parti chercher du lait</strong> : on retire complètement
            les deux jokers du jeu, ce qui empêche la super tour.
          </li>
        </ul>

        <h2>Crédits</h2>
        <p>Créateurs originaux des principales règles : XXXXX, XXXX.</p>
        <p>Ont aidé au peaufinage des règles : OrAxelerator, XXXXXX, XXXXX.</p>
      </section>
    </div>
  );
}

export default Rules;
