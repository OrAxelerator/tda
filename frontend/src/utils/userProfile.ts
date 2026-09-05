import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { UserProfile } from "../types/userProfile";

export async function ensureUserProfile(user: User, fallbackName: string | null) {
  const profileRef = doc(db, "user", user.uid);
  const snapshot = await getDoc(profileRef);
  

  if (snapshot.exists()) {
    console.log("existe déja");
    return;
  }

  const userProfile: UserProfile = {
    uid: user.uid,
    displayName: user.displayName ?? fallbackName ?? user.email?.split("@")[0] ?? "Joueur",
    cardStyle: "default",
    gamesPlayed: 0,
    gamesWon: 0,
    profileBanner: "",
    profileImageUrl: user.photoURL ?? null,
  };

  await setDoc(profileRef, userProfile);
}
