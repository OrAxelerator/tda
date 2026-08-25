import "../home.css"

import Actions from "./home/Actions"

import { useAuth } from "../components/auth-context";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


export default function Home() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleClickParam() {
        if (!user) {
            console.log("user pas connecté peut pas aller dans param");
            toast.error("connecté vous pour allez dans les parametre de votre compte .. ( a changer bruh)")
        }
        else {
            navigate('/settings')
        }
    }

    return (
        <>

        <div className="home">

            <header className="homeHeader">
                <h1>[TDA LOGO]</h1>

                <nav>
                    <ul className="header-actions">
                    <li>
                        <a href="/user">
                        { !user && <div className="warningIcon">!</div> }
                            <i className="header-icon nf nf-fa-user" aria-hidden="true"></i>
                            <span className="sr-only">Profil</span>
                        </a>
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
                        <a href="https://github.com/OrAxelerator/tda">
                            <i className="header-icon nf nf-cod-github" aria-hidden="true"></i>
                            <span className="sr-only">GitHub</span>
                        </a>
                    </li>
                    </ul>
                </nav>
            </header>

            <Actions />
            
        </div>
        </>
    )
}
