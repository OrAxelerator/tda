import { apiUrl, readJsonResponse } from "../config";
import { getAuthHeaders } from "./authHeaders";

export async function leaveRoom(roomId: string) {
    const res = await fetch(
        apiUrl(`/rooms/${roomId}/leave`),
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(await getAuthHeaders()),
            },
        }
    );

    return await readJsonResponse(res);
}
