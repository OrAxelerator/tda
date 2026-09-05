import "../home.css"

import Actions from "./home/Actions"

import { useAuth } from "../components/auth-context";
import { Link } from "react-router-dom";
import {  useEffect, useState } from "react";

export default function Home() {

    const { user } = useAuth();
    const [version, setVersion] = useState<string | null>(null);


    useEffect(() => {
  const fetchLastCommit = async () => {
    try {
      const response = await fetch("https://api.github.com/repos/OrAxelerator/tda/commits");

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération du dernier commit");
      }

      const data = await response.json();

      setVersion(data["0"]["sha"]);
    } catch (error) {
      console.error("Erreur fetch last commit :", error);
    }
  };

  fetchLastCommit();
}, []);

    return (
        <>

        <div className="home">

            <header className="homeHeader">
                <h1>[TDA LOGO]</h1>

                <nav>
                    <ul className="header-actions">
                    <li>
                        <Link to="/user">
                        { !user && <div className="warningIcon">!</div> }
                            <i className="header-icon nf nf-fa-user" aria-hidden="true"></i>
                            <span className="sr-only">Profil</span>
                        </Link>
                    </li>
                    {/* <li>
                        <button onClick={handleClickParam}>
                            <i className="header-icon nf nf-cod-settings_gear" aria-hidden="true"></i>
                            <span className="sr-only">Paramètres</span>
                        </button>
                    </li> */}
                    <li>
                        <button>
                            <i className="header-icon nf nf-fa-star" aria-hidden="true"></i>
                            <span className="sr-only">Credit</span>
                        </button>
                    </li>
                    <li>
                        <a href="https://github.com/OrAxelerator/tda" target="_blank">
                            <i className="header-icon nf nf-cod-github" aria-hidden="true"></i>
                            <span className="sr-only">GitHub</span>
                        </a>
                    </li>
                    </ul>
                </nav>
            </header>


            <button onClick={async () => {

            }}> TEST</button>

            <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", padding: "20px" }}>
  <h3 style={{ margin: "0 auto", marginBottom: "20px" }}>
    ⚠️ LE JEU N'EST PAS ENCORE TOTALEMENT TERMINÉ
  </h3>

  <p style={{ margin: "0 auto", marginBottom: "25px", lineHeight: "1.6" }}>
    Le jeu est actuellement disponible en ligne, mais certaines fonctionnalités
    sont encore en cours de développement et peuvent être amenées à évoluer,
    être modifiées ou ne pas fonctionner comme prévu.
  </p>

  <h3 style={{ margin: "0 auto", marginBottom: "15px" }}>
    📜 Conditions générales
  </h3>

  <p style={{ margin: "0 auto", marginBottom: "25px", lineHeight: "1.6" }}>
    Merci de ne pas créer de compte avec un nom, un profil ou tout autre contenu
    inapproprié. Les adresses e-mail collectées lors de l'utilisation du jeu
    ne sont en aucun cas vendues ou transmises à des services tiers à des fins
    commerciales.
  </p>

  <h4 style={{ margin: "0 auto", marginBottom: "10px" }}>
    Site maintenu par OrAxelerator
  </h4>

  <p style={{ margin: "0 auto", marginBottom: "10px" }}>
    📧 Contact : tda.game.support@gmail.com
  </p>
  <p>versions : {version}</p>
</div>

            <Actions />
            
        </div>
        </>
    )
}
