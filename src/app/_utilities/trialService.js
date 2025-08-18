export async function getQuestionsByExperiment(experimentId) {

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}questions/${experimentId}`, {
        method: 'get',
    });

    if (res.status !== 200) {
        throw new Error("Unable get questions!");
    }

    const res2 = await res.json();
    // console.log(res2)
    const questions = res2.questions;

    return questions;
};

export async function submitResponse(trial_id, submitted_at, question_id, took, choice, is_correct) {
    let payload = new FormData();
    payload.append("trial_id", trial_id);
    payload.append("submitted_at", (new Date(submitted_at)).toISOString());
    payload.append("response_time", took);
    payload.append("question_id", question_id);
    payload.append("choice", choice);
    payload.append("is_correct", is_correct.toString());

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}response/`, {
        method: 'post',
        body: payload,
    });

    if (res.status !== 201) {
        console.log(await res.body);
        throw new Error("Unable to submit response!");
    }

    const res2 = await res.json();
    // console.log(res2)

    return res2;
};