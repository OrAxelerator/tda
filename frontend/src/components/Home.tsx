import "../home.css"

import Actions from "./home/Actions"

import { useAuth } from "../components/auth-context";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


export default function Home() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleClick() {
        if (!user) {
            console.log("UESR PAS CONNECT2 !!!!!!");
        }else {
            console.log(user);
        }
    }


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
                            <img src="user.svg" alt="Profil" />
                        </a>
                    </li>
                    <li>
                        <button onClick={handleClickParam}>
                            <img src="settings.svg" alt="Paramètres" />
                        </button>
                    </li>
                    <li>
                        <button>
                            <img src="credit.svg" alt="Credit" />
                        </button>
                    </li>
                    <li>
                        <a href="https://github.com/OrAxelerator/tda">
                        <img src="github.svg" alt="GitHub" />
                        </a>
                    </li>
                    </ul>
                </nav>
            </header>

            <button onClick={handleClick}>
                test
                </button>

            <Actions />
            
        </div>
        </>
    )
}
