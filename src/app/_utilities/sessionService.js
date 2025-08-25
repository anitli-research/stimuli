export async function getSessions() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}session/users`, {
        method: 'get',
    });

    if (res.status !== 200) {
        throw new Error("Unable to get sessions!");
    }

    const res2 = await res.json();
    return res2;
};

export async function createSession(experimentId, userName) {
    let payload = new FormData();

    payload.append("experimentId", experimentId);
    payload.append("userName", userName);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}session/`, {
        method: 'post',
        body: payload
    });

    if (res.status !== 201) {
        throw new Error("Unable to start a session!");
    }

    const res2 = await res.json();

    return [res2.session_id, res2.blocks, res2.trials];
};

export async function finishSession(sessionId, acc) {
    let payload = new FormData();

    payload.append("acc", acc);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}session/${sessionId}`, {
        method: 'post',
        body: payload
    });

    if (res.status !== 200) {
        throw new Error("Unable to finish a session!");
    }

    return;
};