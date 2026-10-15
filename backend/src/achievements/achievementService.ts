import { AchievementId } from "./achievements";
import admin from "../firebase";

type AchievementEvent =
    | {
        type: "GAME_WON";
        userId: string;
    }
    | {
        type: "CARDS_PLAYED";
        userId: string;
        amount: number;
    }
    | {
        type: "JOKERS_PLAYED";
        userId: string;
    };


export async function handleAchievementEvent(
    event: AchievementEvent
) {

    switch (event.type) {

        case "GAME_WON":
            const userSnapshot = await admin
                .firestore()
                .collection("users")
                .doc(event.userId)
                .get();
            const gamesWon = userSnapshot.data()?.gamesWon ?? 0;

            if (gamesWon >= 1) {
                await unlockAchievement(event.userId, "1V");
            }

            if (gamesWon >= 10) {
                await unlockAchievement(event.userId, "10V");
            }

            break;


        case "CARDS_PLAYED":

            if (event.amount >= 15) {
                await unlockAchievement(event.userId, "15P");
            }

            break;

        case "JOKERS_PLAYED":
            await unlockAchievement(event.userId, "2J");
            break;
    }
}


async function unlockAchievement(
    userId: string,
    achievementId: AchievementId
) {
    const userRef = admin.firestore().collection("users").doc(userId);
    
    await userRef.update({
        achievements: admin.firestore.FieldValue.arrayUnion(achievementId)
    });
    
    console.log(
        `Achievement ${achievementId} débloqué pour ${userId}`
    );
}