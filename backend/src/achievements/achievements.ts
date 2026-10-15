// achievements/achievements.ts

export const ACHIEVEMENTS = {
    "1V": {
        name: "Première victoire",
        description: "Gagnez une partie"
    },
    "10V": {
        name: "Pro de la victoire",
        description: "Gagnez 10 partie"
    },

    "15P": {
        name: "Picohier",
        description: "Jouez 15 cartes ou plus en un seul tour"
    },
    "2J": {
        name: "Double joker",
        description: "Jouez les deux jokers dans la même main"
    }
};

export type AchievementId = keyof typeof ACHIEVEMENTS;