export async function createPool(poolId, stimuli) {
    let body = new FormData();
    body.append("poolId", poolId)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}pool`, {
        method: 'POST',
        body: body,
    });

    if (res.status !== 201) {
        return false;
    }

    let files = new FormData();

    stimuli.forEach(f => {
        files.append("stimuli", f, f.name);
    });

    const res2 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}pool/${poolId}`, {
        method: 'POST',
        body: files,
    });

    if (res2.status !== 200) {
        console.log(res2)
        return false;
    }

    // const tst = new StPool(name, fileUpload.acceptedFiles)
    // // localStorage.setItem("tst", tst);
    return true;
};

export async function getPools() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}pool`, {
        method: 'GET',
    });

    if (res.status !== 200) {
        return null;
    }

    const r = await res.json();
    // console.log(r);
    return r.pools;
}

export async function getStimuliFromPoolId(poolId) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}pool/${poolId}`, {
        method: 'GET',
    });

    if (res.status !== 200) {
        return null;
    }

    const r = await res.json();
    if (r === null) {
        return null;
    }
    const res2 = { poolId: poolId, stimuli: r.stimuli };
    // console.log(res2);
    return res2;
}

export async function getStimulus(poolId, stimulusId) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}pool/${poolId}/${stimulusId}`, {
        method: 'GET',
    });

    if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
    }
    return await res.blob();
}