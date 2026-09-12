import { LeaveRoomButton } from "./LeaveRoomButton";

type GameHeaderUser = {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
};

type RoomPlayer = {
  id: string;
  name: string;
  isHost?: boolean;
  cardCount?: number;
};

type PublicPlayer = {
  id: string;
  name: string;
  isHost: boolean;
  isWinner: boolean;
  cardCount: number;
  isBot: boolean;
};

type GameHeaderProps = {
  user: GameHeaderUser;
  currentTurnPlayer?: { id: string; name: string } | null;
  phase: string;
  numberOfTurn: number;
  deckLength: number;
  socketConnected: boolean;
  roomId: string;
  currentUserUid: string;
  isHost: boolean;
  startGame: () => void;
  allPlayers: RoomPlayer[];
  publicPlayers: PublicPlayer[];
  currentPlayerId: string | null;
  getPlayerAvatar: (player: PublicPlayer) => string;
};

function GameHeader({
  user,
  currentTurnPlayer,
  phase,
  numberOfTurn,
  deckLength,
  socketConnected,
  roomId,
  currentUserUid,
  isHost,
  startGame,
  allPlayers,
  publicPlayers,
  currentPlayerId,
  getPlayerAvatar,
}: GameHeaderProps) {
  return (
    <header className="Appheader">
      <section className="gameInfo">
        <h4>Partie</h4>
        <p>
          <strong>Vous :</strong> {user.displayName || user.email || "Joueur"}
        </p>
        <p>
          <strong>Tour de :</strong> {currentTurnPlayer?.name || "aucun"}
        </p>
        <p>
          <strong>Phase :</strong> {phase || "inconnue"}
        </p>
        <p>
          <strong>Tour :</strong> {numberOfTurn}
        </p>
        <p>
          <strong>Deck :</strong> {deckLength} cartes
        </p>
        <p>
          <strong>Socket :</strong> {socketConnected ? "connecté" : "déconnecté"}
        </p>

        <div className="gameInfoActions">
          <LeaveRoomButton roomId={roomId} playerId={currentUserUid} />
          {phase === "finished" && isHost ? (
            <button className="headerActionButton secondary" onClick={startGame}>
              Relancer partie
            </button>
          ) : null}
        </div>
      </section>

      <section className="players">
        {allPlayers.length === 0 ? (
          <p>
            il n'y a pas de player dans la room donc comment tu vois ce
            message ????
          </p>
        ) : (
          publicPlayers.map((player) => (
            <div
              className={`
                playerInfo
                ${user?.uid === player.id ? "selfPlayer" : ""}
                ${currentPlayerId === player.id ? "activePlayer" : ""}
              `}
              key={player.id}
              id={player.id}
            >
              <div className="playerBadges">
                {user?.uid === player.id && (
                  <span className="playerBadge self">Vous</span>
                )}
                {currentPlayerId === player.id && (
                  <span className="playerBadge turn">Tour</span>
                )}
              </div>

              <img
                src={getPlayerAvatar(player)}
                alt={player.name}
                className="playerAvatar"
                onError={(event) => {
                  event.currentTarget.src = player.isBot ? "/robot.png" : "/default.jpeg";
                }}
              />
              <h3>
                <span>{player.name}</span>
                {player.isHost && <span>[HOST]</span>}
              </h3>
              <h5>
                {player.cardCount
                  ? `${player.cardCount} carte${player.cardCount > 1 ? "s" : ""} restante${player.cardCount > 1 ? "s" : ""}`
                  : ""}
              </h5>
            </div>
          ))
        )}
      </section>
    </header>
  );
}

export default GameHeader;
