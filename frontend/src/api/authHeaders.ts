import { auth } from "../firebase-auth";

// Token Firebase courant, à envoyer au backend pour prouver son identité
export async function getAuthToken(): Promise<string | undefined> {
  return auth.currentUser?.getIdToken();
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
