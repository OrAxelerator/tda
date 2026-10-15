// Catalogue des succès affichés sur le profil.
// Les ids doivent rester synchronisés avec backend/src/achievements/achievements.ts,
// c'est le backend qui les débloque (champ `achievements` du doc users/{uid}).

export interface AchievementInfo {
  name: string;
  description: string;
  icon: string; // classe Nerd Font
}

export const ACHIEVEMENTS: Record<string, AchievementInfo> = {
  "1V": {
    name: "Première victoire",
    description: "Gagnez une partie",
    icon: "nf-fa-trophy",
  },
  "10V": {
    name: "Pro de la victoire",
    description: "Gagnez 10 parties",
    icon: "nf-fa-certificate",
  },
  "15P": {
    name: "Picohier",
    description: "Jouez 15 cartes ou plus en un seul tour",
    icon: "nf-fa-clone",
  },
  "2J": {
    name: "Double joker",
    description: "Jouez les deux jokers dans la même main",
    icon: "nf-fa-star",
  },
};
