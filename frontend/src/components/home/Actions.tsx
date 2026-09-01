import { useState } from "react";
import { toast } from "react-toastify";

import { useAuth } from "../auth-context";
import CreateGameMenu from "./CreateGameMenu";
import ActionBtn from "./ActionMenuButton";
import PlayMenu from "./PlayMenu";

function Actions() {
  const { user } = useAuth();
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

  return (
    <div className="actions">

      <ActionBtn
        isOpen={activeAction === "play"}
        onOpen={handlePlayOpen}
        onClose={() => setActiveAction(null)}
        buttonName="Jouer"
        buttonClass="playGameBtn"
      >
        <PlayMenu />
      </ActionBtn>


      <ActionBtn
        isOpen={activeAction === "create"}
        onOpen={handleCreateOpen}
        onClose={() => setActiveAction(null)}
        buttonName="Créer une partie"
        buttonClass="createGameBtn"
      >
        <CreateGameMenu />
      </ActionBtn>

    </div>
  );
}

export default Actions;
