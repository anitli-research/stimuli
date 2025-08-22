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

export default function Trial({ params }) {
    const { experimentName, sessionName } = useParams();
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
    // const [blockAc, setBlockAc] = useState(0.0);
    const [totAc, setTotAc] = useState(0.0);
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
    const startTrial = async () => {
        try {
            setLoading(true);
            console.log(`start ${data.value.exp.experiment_id}/${sessionName}`)
            const [sessionId, blocks, trials] = await createSession(data.value.exp.experiment_id, sessionName);
            console.log(sessionId);
            console.log(blocks);
            console.log(trials);

            setSessionId(sessionId);
            setBlocks(blocks);
            setTrials(trials);
            const new_block = blocks.find(b => b.block_idx === blockIdx);
            setBlock(new_block);
            setTrial(trials.find(t => t.block_id = new_block.block_id && t.trial_idx === trialIdx));
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

    const choice = async (c) => {
        const submitted_at = Date.now();
        const took = (new Date(Math.abs(submitted_at - renderTs))).getMilliseconds();
        const is_correct = trial.expected === c;
        await submitResponse(trial.trial_id, submitted_at, trial.trial_id, took, c, is_correct);
        if (is_correct) {
            setNCorrect(nCorrect + 1);
        }
        if (trialIdx === block.n_trials) {
            const ac = ((is_correct ? nCorrect + 1 : nCorrect) / block.n_trials);
            setTotAc(totAc + ac)

            if (blockIdx === blocks.length) {
                await finishSession(sessionId, ((totAc + ac) * 100 / blocks.length).toFixed(2));
                setEnded(true);
                return;
            } else {
                setShowBreak(true);
                return;
            }
        }
        setShowArray(false);
        setTrialIdx(trialIdx + 1);
        setTrial(trials.find(t => t.block_id = block.block_id && t.trial_idx === trialIdx));
    };

    const nextBlock = () => {
        setNCorrect(0);
        setBlockIdx(blockIdx + 1);
        const new_block = blocks.find(b => b.block_idx === blockIdx);
        setBlock(new_block);
        setTrialIdx(1);
        setTrial(trials.find(t => t.block_id = new_block.block_id && t.trial_idx === trialIdx));
        setShowBreak(false);
    };

    const genArray = () => {
        let arr = JSON.parse(JSON.stringify(trial.distractors));
        const rIdx = Math.floor(Math.random() * (arr.length + 1));
        arr.splice(rIdx, 0, trial.expected);
        return arr;
    };

    return <Container h="100%">
        <Center h="100%">
            {data.loading && (
                <Spinner size="xl" borderWidth="1.5px" color="colorPalette.600" colorPalette="green" />
            )}
            {data.error && (
                data.error.message
            )}
            {sessionId === null && !data.loading && !!!data.error &&
                <VStack>
                    <Text textStyle="4xl" textAlign="center">You will see a word or picture at the top of the screen.</Text>
                    <Text textStyle="4xl" textAlign="center">Click it, and choices will appear at the bottom.</Text>
                    <Text textStyle="4xl" textAlign="center">Pick the choice you think goes with the one on top.</Text>
                    <Center><Button loading={loading} size="xl" colorPalette="blue" onClick={startTrial}>Start trial</Button></Center>
                </VStack>
            }
            {
                showBreak &&
                <Stack>
                    <Text textStyle="4xl">You just finished block {blockIdx} out of {blocks.length} blocks.</Text>
                    {data.value.exp.feedback !== 0 && <Text textAlign="center" textStyle="3xl">Your accuracy was: {((nCorrect / blocks.length) * 100).toFixed(2)}%</Text>}
                    <Button size="xl" colorPalette="blue" onClick={nextBlock}>Start next block</Button>
                </Stack>
            }
            {
                !showBreak && sessionId !== null && trial !== null && !ended &&
                // <h1>{experimentName} {userId}</h1>
                <Flex direction="column" height="100%" rowGap="10%">
                    <Center height="50%" maxWidth="100%" >
                        <Image src={`${data.value.pool[trial.stimulus]}`} fit="contain" maxHeight="100%" cursor="pointer" onClick={handleShowArray} />
                    </Center >
                    {showArray &&
                        <Flex direction="row" justify="space-between" height="40%" width="100%" gap="3%" >
                            {genArray().map((e, idx) => {
                                console.log("array");
                                console.log(e);
                                console.log(idx);
                                return <Image key={`${e}_${idx}`} src={`${data.value.pool[e]}`} fit="scale-down" minWidth={0} cursor="pointer" maxHeight="100%" onClick={() => choice(e)} />
                            })}
                        </Flex >}
                </Flex >
            }
            {
                ended &&
                <Stack>
                    <Text textStyle="4xl">You finished the session!</Text>
                    <Text textStyle="4xl">Please contact the researcher.</Text>
                    {data.value.exp.feedback !== 0 && <Text textAlign="center" textStyle="3xl">Your accuracy was: {((totAc / blocks.length) * 100).toFixed(2)}%</Text>}
                </Stack>
            }
        </Center >
    </Container >
}