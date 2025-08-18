export async function ospfGetPools() {
    const opfsRoot = await navigator.storage.getDirectory();
    const opfsPools = await opfsRoot.getDirectoryHandle('pools', { create: true });
    const pools = await Array.fromAsync(await opfsPools.keys())
    return pools;
}

export async function ospfGetStimuli(poolId) {
    console.log(`Getting stimuli for ${poolId}`)
    const opfsRoot = await navigator.storage.getDirectory();
    const opfsPools = await opfsRoot.getDirectoryHandle('pools', { create: true });
    const opfsPool = await opfsPools.getDirectoryHandle(poolId, { create: true });

    const st = await Array.fromAsync(await opfsPool.keys())
    console.log(st)

    return st;
}



export async function ospfGetURLs(poolId) {
    // console.log(`Getting stimuli for ${poolId}`)
    const opfsRoot = await navigator.storage.getDirectory();
    const opfsPools = await opfsRoot.getDirectoryHandle('pools', { create: true });
    const opfsPool = await opfsPools.getDirectoryHandle(poolId, { create: true });

    let nameToUrl = {}

    for await (const [key, value] of opfsPool.entries()) {
        // console.log({ key, value });
        const f = await value.getFile();
        // console.log(f);
        const url = URL.createObjectURL(f);
        nameToUrl[key] = url
    }
    // console.log(nameToUrl);

    return nameToUrl;
}