import { FirebaseError } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { createGame } from "../game/createGame";
import type { Card as EngineCard } from "../engine/Card";
import { db } from "./firebase";
import { useAuth } from "./useAuth";

type RoomMessage = {
  id: string;
  text: string;
  uid: string;
  authorEmail: string | null;
  authorName: string;
  createdAt?: Timestamp | null;
};

type RoomPlayer = {
  id: string;
  email: string | null;
  displayName: string;
};

type EngineTestResult = {
  turn: number;
  currentPlayerId: string | null;
  deckSize: number;
  axelHandCount: number;
  bobHandCount: number;
  axelLastCard?: string;
};

export default function GameRoom() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTestingEngine, setIsTestingEngine] = useState(false);
  const [engineTest, setEngineTest] = useState<EngineTestResult | null>(null);

  const normalizedRoomCode = useMemo(
    () => roomCode?.trim().toUpperCase() ?? "",
    [roomCode],
  );

  useEffect(() => {
    if (!normalizedRoomCode || !user) return;

    const playerName = user.displayName || user.email || "Joueur";

    void setDoc(
      doc(db, "rooms", normalizedRoomCode),
      {
        code: normalizedRoomCode,
        lastJoinedAt: serverTimestamp(),
      },
      { merge: true },
    );

    void setDoc(
      doc(db, "rooms", normalizedRoomCode, "players", user.uid),
      {
        email: user.email,
        displayName: playerName,
        joinedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, [normalizedRoomCode, user]);

  useEffect(() => {
    if (!normalizedRoomCode) return;

    const playersRef = collection(db, "rooms", normalizedRoomCode, "players");
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const nextPlayers = snapshot.docs.map((playerDoc) => {
        const data = playerDoc.data() as Omit<RoomPlayer, "id">;

        return {
          id: playerDoc.id,
          email: data.email ?? null,
          displayName: data.displayName || data.email || "Joueur",
        };
      });

      setPlayers(nextPlayers);
    });

    return unsubscribe;
  }, [normalizedRoomCode]);

  useEffect(() => {
    if (!normalizedRoomCode) return;

    const messagesQuery = query(
      collection(db, "rooms", normalizedRoomCode, "messages"),
      orderBy("createdAt", "asc"),
      limit(100),
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const nextMessages = snapshot.docs.map((messageDoc) => {
        const data = messageDoc.data() as Omit<RoomMessage, "id">;

        return {
          id: messageDoc.id,
          text: data.text || "",
          uid: data.uid,
          authorEmail: data.authorEmail ?? null,
          authorName: data.authorName || data.authorEmail || "Joueur",
          createdAt: data.createdAt,
        };
      });

      setMessages(nextMessages);
    });

    return unsubscribe;
  }, [normalizedRoomCode]);

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) return;

    const text = messageText.trim();

    if (!text) return;

    setIsSending(true);

    try {
      await addDoc(collection(db, "rooms", normalizedRoomCode, "messages"), {
        text,
        uid: user.uid,
        authorEmail: user.email,
        authorName: user.displayName || user.email || "Joueur",
        createdAt: serverTimestamp(),
      });

      setMessageText("");
    } catch (error) {
      const message =
        error instanceof FirebaseError
          ? error.message
          : "Impossible d'envoyer le message.";
      toast.error(message, {
        position: "bottom-center",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTestGameEngine = async () => {
    setIsTestingEngine(true);

    try {
      const response = await fetch("/cards.json");

      if (!response.ok) {
        throw new Error("Impossible de charger cards.json");
      }

      const cards = (await response.json()) as EngineCard[];
      const engine = createGame(cards);

      engine.drawCard("1");
      engine.nextTurn();

      const axel = engine.state.players.find((player) => player.id === "1");
      const bob = engine.state.players.find((player) => player.id === "2");
      const axelLastCard = axel?.hand.at(-1);

      setEngineTest({
        turn: engine.state.turn,
        currentPlayerId: engine.state.currentPlayerId,
        deckSize: engine.state.deck.size(),
        axelHandCount: axel?.hand.length ?? 0,
        bobHandCount: bob?.hand.length ?? 0,
        axelLastCard: axelLastCard
          ? `${axelLastCard.name} (#${axelLastCard.id})`
          : undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de tester le GameEngine.";
      toast.error(message, {
        position: "bottom-center",
      });
    } finally {
      setIsTestingEngine(false);
    }
  };

  if (!normalizedRoomCode) {
    return <Navigate to="/user" replace />;
  }

  return (
    <section className="room-page">
      <header className="room-header">
        <div>
          <p className="room-label">Room</p>
          <h2>{normalizedRoomCode}</h2>
        </div>
        <Link className="btn btn-secondary" to="/user">
          Retour
        </Link>
      </header>

      <div className="room-layout">
        <aside className="players-panel">
          <h3>Joueurs</h3>
          <ul>
            {players.map((player) => (
              <li key={player.id}>
                <span>{player.displayName || "Joueur"}</span>
                <small>{player.email}</small>
              </li>
            ))}
          </ul>

          <div className="engine-test-panel">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTestGameEngine}
              disabled={isTestingEngine}
            >
              {isTestingEngine ? "Test..." : "Tester GameEngine"}
            </button>

            {engineTest && (
              <dl>
                <div>
                  <dt>Tour</dt>
                  <dd>{engineTest.turn}</dd>
                </div>
                <div>
                  <dt>Joueur actuel</dt>
                  <dd>{engineTest.currentPlayerId}</dd>
                </div>
                <div>
                  <dt>Deck</dt>
                  <dd>{engineTest.deckSize} cartes</dd>
                </div>
                <div>
                  <dt>Axel</dt>
                  <dd>{engineTest.axelHandCount} cartes</dd>
                </div>
                <div>
                  <dt>Bob</dt>
                  <dd>{engineTest.bobHandCount} cartes</dd>
                </div>
                {engineTest.axelLastCard && (
                  <div>
                    <dt>Dernière pioche Axel</dt>
                    <dd>{engineTest.axelLastCard}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </aside>

        <div className="chat-panel">
          <div className="messages-list">
            {messages.length === 0 ? (
              <p className="empty-chat">Aucun message pour le moment.</p>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={
                    message.uid === user?.uid
                      ? "chat-message own-message"
                      : "chat-message"
                  }
                >
                  <div>
                    <strong>{message.authorName}</strong>
                    <time>
                      {message.createdAt
                        ? message.createdAt.toDate().toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "..."}
                    </time>
                  </div>
                  <p>{message.text}</p>
                </article>
              ))
            )}
          </div>

          <form className="chat-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="form-control"
              placeholder="Écrire un message..."
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSending || !messageText.trim()}
            >
              Envoyer
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
