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

      setVersion(String(data["0"]["sha"]).slice(0, 7));
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
                        <Link to="/regles" title="Règles du jeu">
                            <i className="header-icon nf nf-fa-book" aria-hidden="true"></i>
                            <span className="sr-only">Règles du jeu</span>
                        </Link>
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


            <p className="homeWarning">
                ⚠️ Le jeu n'est pas encore terminé : certaines fonctionnalités peuvent
                évoluer ou ne pas fonctionner comme prévu.
            </p>

            <details className="homeInfo">
                <summary>
                    <i className="nf nf-fa-info_circle" aria-hidden="true"></i>
                    Infos & conditions
                </summary>
                <div className="homeInfoContent">
                    <h4>📜 Conditions générales</h4>
                    <p>
                        Merci de ne pas créer de compte avec un nom, un profil ou tout autre contenu
                        inapproprié. Les adresses e-mail collectées lors de l'utilisation du jeu
                        ne sont en aucun cas vendues ou transmises à des services tiers à des fins
                        commerciales.
                    </p>
                    <p>Site maintenu par OrAxelerator</p>
                    <p>
                        📧 Contact :{" "}
                        <a href="mailto:tda.game.support@gmail.com">tda.game.support@gmail.com</a>
                    </p>
                    {version ? <p className="homeVersion">Version : {version}</p> : null}
                </div>
            </details>

            <Actions />
            
        </div>
        </>
    )
}
