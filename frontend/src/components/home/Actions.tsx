import { lazy, Suspense, useState, useEffect } from "react";
import { toast } from "react-toastify";

import { useAuth } from "../auth-context";
import ActionBtn from "./ActionMenuButton";

const CreateGameMenu = lazy(() => import("./CreateGameMenu"));
const PlayMenu = lazy(() => import("./PlayMenu"));

function Actions() {
  const { user, loading } = useAuth();
  const [activeAction, setActiveAction] = useState<
    "play" | "create" | null
  >(null);

  const handlePlayOpen = () => {
    if (!user) {
      toast.error("Tu dois être connecté pour rejoindre une partie.");
      return;
    }

    setActiveAction("play");
  };

    const handleCreateOpen = () => {
    if (!user) {
      toast.error("Tu dois être connecté pour créer une partie.");
      return;
    }

    setActiveAction("create");
  };

  useEffect(() => {
    if (loading) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "&" && activeAction == null) {
        handlePlayOpen();
      }

      if (event.key === "é" && activeAction == null) {
        handleCreateOpen();
      }

    };
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [activeAction, loading, user]);


  return (
    <div className="actions">

      <ActionBtn
        isOpen={activeAction === "play"}
        onOpen={handlePlayOpen}
        onClose={() => setActiveAction(null)}
        buttonName="Jouer"
        buttonClass="playGameBtn"
      >
        <Suspense fallback={<p>Chargement...</p>}>
          <PlayMenu />
        </Suspense>
      </ActionBtn>


      <ActionBtn
        isOpen={activeAction === "create"}
        onOpen={handleCreateOpen}
        onClose={() => setActiveAction(null)}
        buttonName="Créer une partie"
        buttonClass="createGameBtn"
      >
        <Suspense fallback={<p>Chargement...</p>}>
          <CreateGameMenu />
        </Suspense>
      </ActionBtn>

    </div>
  );
}

export default Actions;
