import { useState } from "react";

import ActionBtn from "./ActionMenuButton";
import PlayMenu from "./PlayMenu";
import CreateGameMenu from "./CreateGameMenu";

function Actions() {
  const [activeAction, setActiveAction] = useState<
    "play" | "create" | null
  >(null);

  return (
    <div className="actions">

      <ActionBtn
        isOpen={activeAction === "play"}
        onOpen={() => setActiveAction("play")}
        onClose={() => setActiveAction(null)}
        buttonName="Play"
        buttonClass="playGameBtn"
      >
        <PlayMenu />
      </ActionBtn>


      <ActionBtn
        isOpen={activeAction === "create"}
        onOpen={() => setActiveAction("create")}
        onClose={() => setActiveAction(null)}
        buttonName="Create game"
        buttonClass="createGameBtn"
      >
        <CreateGameMenu />
      </ActionBtn>

    </div>
  );
}

export default Actions;
