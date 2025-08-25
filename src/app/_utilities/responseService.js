export async function getResponses(username) {
    // let body = new FormData();
    // body.append("session_id", session_id)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}csv/${username}`, {
        method: 'get',
        // body: body
    });

    if (res.status !== 200) {
        throw new Error("Unable to get sessions!");
    }

    const res2 = await res.json();
    return res2;
};