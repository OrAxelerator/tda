import { apiUrl, readJsonResponse } from "../config";

export async function leaveRoom(roomId: string, playerId: string) {
    const res = await fetch(
        apiUrl(`/rooms/${roomId}/leave`),
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                playerId
            })
        }
    );

    return await readJsonResponse(res);
}
