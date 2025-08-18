class Response {
    // Find a better name
    trial;
    choice;
    is_correct;
    constructor(trial, choice) {
        this.trial = trial
        this.choice = choice
        this.is_correct = trial.answer === choice
    }
}

export default Response;