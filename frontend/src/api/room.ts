export async function leaveRoom(roomId: string, playerId: string) {
    const res = await fetch(
        `http://localhost:3000/rooms/${roomId}/leave`,
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

    return await res.json();
}