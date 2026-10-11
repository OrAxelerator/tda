// Une partie compte au maximum 6 joueurs : l'hôte + 5 bots.
export const MAX_BOTS = 5;

// Retourne le nombre de bots demandé, ou null si la valeur est invalide.
// Absent ou vide = 0 bot. Accepte un nombre ou une chaîne ("3").
export function parseBotCount(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const count = Number(value);

  if (!Number.isInteger(count) || count < 0 || count > MAX_BOTS) {
    return null;
  }

  return count;
}
