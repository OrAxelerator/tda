import "../home.css"

import Actions from "./home/Action"

export default function Home() {

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
                        <a href="/settings">
                        <img src="settings.svg" alt="Paramètres" />
                        </a>
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

            <Actions />
        </div>


            {/* <div className="actionBtn">
                <ActionBtn buttonName="Play" buttonClass="playGameBtn" >
                    <PlayMenu />
                </ActionBtn>

                <ActionBtn buttonName="Create Game" buttonClass="createGameBtn" >
                    <CreateMenu />
                </ActionBtn>
                
            </div> */}


        </>
    )
}