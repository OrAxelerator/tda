import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "./auth-context";
import { auth } from "./firebase";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      logout: () => signOut(auth),
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
