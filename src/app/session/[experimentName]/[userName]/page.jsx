"use client"
import { useState, useEffect } from "react"
import { useAsync } from "react-use"
import { useParams } from 'next/navigation'
import { Center, Container, Flex, Spinner, Image, Button, Stack, Text, VStack } from "@chakra-ui/react";
import { getExperimentByName } from "../../../_utilities/ExperimentService"
import { createSession, finishSession } from "../../../_utilities/sessionService"
import { submitResponse } from "../../../_utilities/trialService"
import { toaster } from "@/components/ui/toaster"
import { useRouter } from 'next/navigation';
import { ospfGetURLs } from "@/app/_utilities/ospf";
import { CiFaceFrown, CiFaceSmile } from "react-icons/ci";

export default function Session({ params }) {
    const { experimentName, userName } = useParams();
    const [fail, setFail] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [trials, setTrials] = useState(null);
    const [trial, setTrial] = useState(null);
    const [blocks, setBlocks] = useState(null);
    const [block, setBlock] = useState(null);
    const [blockIdx, setBlockIdx] = useState(1);
    const [trialIdx, setTrialIdx] = useState(1);
    const [showArray, setShowArray] = useState(false);
    const [renderTs, setRenderTs] = useState(null);
    const [showBreak, setShowBreak] = useState(false);
    const [nCorrect, setNCorrect] = useState(0);
    const [ended, setEnded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [blockAcc, setBlockAcc] = useState(0.0);
    const [totAc, setTotAc] = useState(0.0);
    const [showFeedback, setShowFeedback] = useState(null);
    const router = useRouter();

    useEffect(() => {
        if (fail) {
            toaster.create({
                description: "Invalid trial!",
                type: "error",
            });
            // router.push('/');
        }
    }, [fail])
    let data = useAsync(async () => {
        try {
            const exp = await getExperimentByName(experimentName);
            // const blocks = await getBlocks(exp);
            // const rel = await getRelations(exp);
            console.log(exp);
            const pool = await ospfGetURLs(exp.pool_id);
            console.log(pool);
            if (((Object.entries(pool))).length === 0) {
                throw new Error("Empty pool, try synchronize with FTP");
            }

            // const blocks = await getBlocks(exp);
            // console.log({ "exp": exp, "pool": pool, "blocks": blocks });
            return { "exp": exp, "pool": pool }
        } catch (e) {
            console.log(e);
            setFail(true);
            throw e;
        }
    }, []);
    // useEffect(, [exp.loading    ])
    const startSession = async () => {
        try {
            setLoading(true);
            console.log(`start ${data.value.exp.experiment_id}/${userName}`)
            const [sessionId, blocks, trials] = await createSession(data.value.exp.experiment_id, userName);
            console.log(sessionId);
            console.log(blocks);
            console.log(trials);

            setSessionId(sessionId);
            setBlocks(blocks);
            setTrials(trials);
            const new_block = blocks.find(b => b.block_idx === 1);
            setBlock(new_block);
            setTrial(trials.find(t => t.block_id === new_block.block_id && t.trial_idx === 1));
            setLoading(false);
        } catch (e) {
            console.log(e);
            setFail(true);
            setLoading(false);
            throw e;
        }
    };

    const handleShowArray = () => {
        setRenderTs(Date.now());
        setShowArray(true);
    }

    const handleShowFeedback = () => {
        setShowFeedback(null);
    }

    const choice = async (c) => {
        const submitted_at = Date.now();
        const took = (new Date(Math.abs(submitted_at - renderTs))).getMilliseconds();
        const is_correct = trial.expected === c;
        await submitResponse(trial.trial_id, submitted_at, trial.trial_id, took, c, is_correct);
        if (is_correct) {
            setNCorrect(nCorrect + 1);
        }
        if (data.value.exp.feedback !== 0) {
            setShowFeedback(is_correct);
            setTimeout(handleShowFeedback, 2000);
        }
        // end of a block
        if (trialIdx === block.n_trials) {
            const block_acc = ((is_correct ? nCorrect + 1 : nCorrect) / block.n_trials);
            const tot_acc = totAc + block_acc;
            setTotAc(tot_acc);
            setBlockAcc(block_acc);
            console.log(`blockAcc: ${block_acc} and totAcc: ${tot_acc}`);
            // last block
            if (blockIdx === blocks.length) {
                await finishSession(sessionId, (tot_acc * 100 / blocks.length).toFixed(2));
                setEnded(true);
                return;
            } else {
                setShowBreak(true);
                return;
            }
        }
        setShowArray(false);
        const old_idx = trialIdx;
        setTrialIdx(old_idx + 1);
        setTrial(trials.find(t => t.block_id === block.block_id && t.trial_idx === (old_idx + 1)));
    };

    const nextBlock = () => {
        setNCorrect(0);
        const old_blockIdx = blockIdx;
        setBlockIdx(old_blockIdx + 1);
        const new_block = blocks.find(b => b.block_idx === (old_blockIdx + 1));
        console.log(new_block);
        setBlock(new_block);
        setTrialIdx(1);
        setTrial(trials.find(t => t.block_id === new_block.block_id && t.trial_idx === 1));
        setShowBreak(false);
    };

    const genArray = () => {
        let arr = JSON.parse(JSON.stringify(trial.distractors));
        const rIdx = Math.floor(Math.random() * (arr.length + 1));
        arr.splice(rIdx, 0, trial.expected);
        return arr;
    };

    const formatAcc = (acc) => {
        return (acc * 100).toFixed(2);
    };

    return <Container h="100%">
        <Center h="100%">
            {data.loading && (
                <Spinner size="xl" borderWidth="1.5px" color="colorPalette.600" colorPalette="green" />
            )}
            {data.error && (
                data.error.message
            )}
            {showFeedback === true &&
                <Center>
                    <CiFaceSmile size="100%" color="green" />
                </Center>
            }
            {showFeedback === false &&
                <Center>
                    <CiFaceFrown size="100%" color="red" />
                </Center>
            }
            {showFeedback === null && sessionId === null && !data.loading && !!!data.error &&
                <VStack>
                    <Text textStyle="3xl" textAlign="center">
                        You will see a word or picture at the top of the screen.
                        <br />
                        Click it, and choices will appear at the bottom.
                        <br />
                        Pick the choice you think goes with the one on top.
                        <br />
                        Sometimes you will see:
                        <br />
                        Happy face = correct
                        <br />
                        Sad face = incorrect
                        <br />
                        Other times, you will not see if you are correct.
                        <br />
                        When the session ends, please tell your researcher right away.
                    </Text>
                    <Center><Button loading={loading} size="xl" colorPalette="blue" onClick={startSession}>Start trial</Button></Center>
                </VStack>
            }
            {showFeedback === null &&
                showBreak &&
                <Stack>
                    <Text textStyle="4xl">You just finished block {blockIdx} out of {blocks.length} blocks.</Text>
                    {data.value.exp.accuracy !== 0 && <Text textAlign="center" textStyle="3xl">Your accuracy was: {formatAcc(blockAcc)}%</Text>}
                    <Button size="xl" colorPalette="blue" onClick={nextBlock}>Start next block</Button>
                </Stack>
            }
            {showFeedback === null &&
                !showBreak && sessionId !== null && trial !== null && !ended &&
                // <h1>{experimentName} {userId}</h1>
                <Flex direction="column" height="100%" rowGap="10%">
                    <Center height="50%" maxWidth="100%" >
                        <Image src={`${data.value.pool[trial.stimulus]}`} fit="contain" maxHeight="100%" cursor="pointer" onClick={handleShowArray} />
                    </Center >
                    {showArray &&
                        <Flex direction="row" justify="space-between" height="40%" width="100%" gap="3%" >
                            {genArray().map((e, idx) => {
                                return <Image key={`${e}_${idx}`} src={`${data.value.pool[e]}`} fit="scale-down" minWidth={0} cursor="pointer" maxHeight="100%" onClick={() => choice(e)} />
                            })}
                        </Flex >}
                </Flex >
            }
            {showFeedback === null &&
                ended &&
                <Stack>
                    <Text textStyle="4xl">You finished the session!</Text>
                    <Text textStyle="4xl">Please contact the researcher.</Text>
                    {data.value.exp.accuracy !== 0 && <Text textAlign="center" textStyle="3xl">Your accuracy was: {formatAcc(totAc / blocks.length)}%</Text>}
                </Stack>
            }
        </Center >
    </Container >
}