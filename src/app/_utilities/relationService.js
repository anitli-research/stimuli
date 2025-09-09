export async function getRelation(blockId) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}relation/${blockId}`, {
            method: 'get',
    });
    const body = await res.json()
    if (res.status != 200) {
        throw new Error(`Fail to get relation ${body}`);
    }
    return body;
};