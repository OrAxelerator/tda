// src/config.ts

export const API_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "")
).replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function readJsonResponse(response: Response) {
  const body = await response.text();

  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`Réponse backend invalide (${response.status} ${response.statusText})`);
  }
}
