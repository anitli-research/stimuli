export async function createExperiment(exp, blocks, rel) {
    let body = new FormData();

    for (let key in exp) {
        body.append(key, exp[key]);
    }

    body.append("rel", JSON.stringify(rel));
    body.append("blocks", JSON.stringify(blocks));

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}experiment`, {
        method: 'POST',
        body: body,
    });

    if (res.status !== 201) {
        console.log(await res.json());
        return false;
    }

    // const res2 = await res.json();
    // const exp_id = res2.experiment_id;
    // console.log(`exp_id: ${exp_id}`);

    return true;
};

export async function getExperimentById(experiment_id) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}experiment/${experiment_id}`, {
        method: 'GET',
    });

    if (res.status !== 200) {
        throw new Error("Invalid experiment name");
    }

    const exp = await res.json();
    // console.log(exp);
    return exp;
}

export async function getExperimentByName(experimentName) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}experiment/${experimentName}`, {
        method: 'GET',
    });

    if (res.status !== 200) {
        throw new Error("Invalid experiment name");
    }

    const exp = await res.json();
    // console.log(exp);
    return exp;
}

export async function getExperiments() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}experiment/`, {
        method: 'GET',
    });

    if (res.status !== 200) {
        throw new Error("Invalid experiment name");
    }

    const exps = await res.json();
    return exps;
}