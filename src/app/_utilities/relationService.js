export async function getRelations(exp) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}relation/${exp.experiment_id}`, {
            method: 'get',
    });
    const body = await res.json()
    if (res.status != 200) {
        throw new Error(`Fail to get relation ${body}`);
    }
    return body;
};