import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase-db";
import type { UserProfile } from "../types/userProfile";

function getUserProfile(user: User, fallbackName: string | null): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName ?? fallbackName ?? user.email?.split("@")[0] ?? "Joueur",
    cardStyle: "default",
    gamesPlayed: 0,
    gamesWon: 0,
    profileBanner: "",
    profileImageUrl: user.photoURL ?? null,
    achievements: [],
    role: []
  };
}

export async function createUserProfile(user: User, fallbackName: string | null) {
  const profileRef = doc(db, "users", user.uid);
  await setDoc(profileRef, getUserProfile(user, fallbackName));
}

export async function ensureUserProfile(user: User, fallbackName: string | null) {
  const profileRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(profileRef);

  if (snapshot.exists()) {
    return;
  }

  await createUserProfile(user, fallbackName);
}
