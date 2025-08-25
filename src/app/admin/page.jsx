"use client"
import { Button, SkeletonText, CloseButton, Dialog, Table, Flex, Heading, Select, createListCollection, Spinner, Portal, Link as ChakraLink, Field, Input, HStack, Center, Container } from "@chakra-ui/react"
import { LuFilePlus, LuFlaskConical, LuFolderSync, LuCirclePlay } from 'react-icons/lu'
import Link from 'next/link'
import { useEffect, useState, useMemo, useContext } from "react"
import { useAsync } from "react-use"
import { getPools, getStimuliFromPoolId, getStimulus } from "../_utilities/PoolService"
import { getExperiments } from "../_utilities/ExperimentService"
import { ospfGetPools } from "../_utilities/ospf"
import { toaster } from "@/components/ui/toaster"
import { useRouter } from 'next/navigation';
import { getSessions } from "../_utilities/sessionService"
import { getResponses } from "../_utilities/responseService"
import { PasswordInput } from "@/components/ui/password-input"
import { AuthContext } from '../../components/ui/AuthProvider';


export default function PoolList() {
    const router = useRouter();
    const authCtx = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [pool, setPool] = useState([]);
    const [session, setSession] = useState([]);
    const [validSessionName, setValidSessionName] = useState(true);
    const [sessionName, setSessionName] = useState("");
    const [pwd, setPwd] = useState("");
    let pools = useAsync(async () => await ospfGetPools(), [loading]);
    let exps = useAsync(async () => await getExperiments(), [loading]);
    let sessions = useAsync(async () => await getSessions(), [loading]);

    // const generateCsv = async () => {
    const generateCsv = async (username) => {
        console.log("making csv");
        console.log(username);
        const usrname = username[0];

        let responses = await getResponses(usrname);
        for (let i = 0; i < responses.length; i++) {
            responses[i].distractors = `"${responses[i].distractors.join(',')}"`;
        }
        const headers = Object.keys(responses[0]);
        const rowsArray = responses.map(resp => Object.values(resp));
        console.log(responses[0]);
        console.log(rowsArray[0]);
        console.log(headers);
        console.log(headers.length);

        let csvRows = [];
        csvRows.push(headers.join(';'));

        rowsArray.forEach(row => {
            csvRows.push(row.join(';'));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `responses_${usrname}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleStartSession = (exp) => {
        if (sessionName.length < 1) {
            setValidSessionName(false);
            return;
        }
        router.push(`/session/${exp.name}/${sessionName}`)
    };

    const collectionSession = useMemo(() => {
        return createListCollection({
            items: sessions.value ?? [],
            itemToString: (p) => p.session_id,
            itemToValue: (p) => p,
        })
    }, [sessions.value]);

    function PoolSelect() {
        const collectionPool = useMemo(() => {
            return createListCollection({
                items: pools.value ?? [],
                itemToString: (p) => p,
                itemToValue: (p) => p,
            })
        }, [pools.value]);

        return (
            <Select.Root collection={collectionPool} value={pool}
                onValueChange={async (e) => {
                    // const response = await fetch(`http://localhost:3001/pool/${e.value}`)
                    // console.log("Api res")
                    // console.log(response)
                    // const data = await response.json()
                    // console.log(data)
                    setPool(e.value)
                }}>
                <Select.HiddenSelect />
                <Select.Label>Available stimuli pools</Select.Label>
                <Select.Control>
                    <Select.Trigger>
                        <Select.ValueText placeholder="Select stimuli pool" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                        {pools.loading && (
                            <Spinner size="xs" borderWidth="1.5px" color="fg.muted" />
                        )}
                        <Select.Indicator />
                    </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                    <Select.Positioner>
                        <Select.Content>
                            {collectionPool.items.map((pool) => (
                                <Select.Item item={pool} key={pool}>
                                    {pool}
                                    <Select.ItemIndicator />
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Positioner>
                </Portal>
            </Select.Root>
        )
    }

    const syncFtp = async e => {
        setLoading(true);
        console.log("Synchronizing with FTP server");

        const pools = await getPools();
        if (pools === null) {
            toaster.create({
                description: "FTP server unavailable",
                type: "error",
            });
            setLoading(false);
            return;
        }

        console.log(pools);
        const opfsRoot = await navigator.storage.getDirectory();
        try {
            await opfsRoot.removeEntry("pools", { recursive: true });
        } catch { }
        console.log("Reset");

        const opfsPools = await opfsRoot.getDirectoryHandle('pools', { create: true });


        let maybeStimuli = pools.map(poolId => {
            return getStimuliFromPoolId(poolId);
        });

        const stimuli = await Promise.all(maybeStimuli);

        for (const pool of stimuli) {
            console.log(`Checking: ${pool.poolId}`);
            const opfsPool = await opfsPools.getDirectoryHandle(pool.poolId, { create: true });
            for (const st of pool.stimuli) {
                try {
                    const s = await opfsPool.getFileHandle(st.name);
                    console.log(`File "${pool.poolId}/${st.name}" exists.`);
                } catch (error) {
                    if (error.name === 'NotFoundError') {
                        try {
                            console.log(`File "${pool.poolId}/${st.name}" does not exists.`);
                            const blob = await getStimulus(pool.poolId, st.name);
                            const fileHandle = await opfsPool.getFileHandle(st.name, { create: true });
                            const wStream = await fileHandle.createWritable();
                            await wStream.write(blob);
                            await wStream.close();
                            console.log(`Successfully downloaded "${pool.poolId}/${st.name}".`);
                        } catch {
                            try {
                                await opfsPool.removeEntry(st.name);
                            } catch {

                            }
                        }
                    } else {
                        // Handle other potential errors
                        console.error('Error checking file existence:', error);
                    }
                }
            }

        }
        setLoading(false);
    }
    const handleAuth = async () => {
        
        const res = await authCtx.login(pwd);
        if (!res) {
            toaster.create({
                description: "Unauthorized",
                type: "error",
            });
            authCtx.setCred(null);
        }
    }
    return (
        <Container h="100%">
            {!authCtx.authorized &&
                <Center h="100%">
                    <PasswordInput placeholder="Insert your password" size="lg" value={pwd} onChange={(e) => setPwd(e.target.value)}/>
                    <Button type="submit" onClick={handleAuth}>Log in</Button>
                </Center>}
            {authCtx.authorized &&
                <Flex direction="column" justify="center" gap="4">
                    <Button loading={loading} colorPalette="purple" minW="15%" alignSelf="end" onClick={syncFtp}>
                        <LuFolderSync /> Sync
                    </Button>
                    <Heading size="4xl" fontWeight="bold" textAlign="center">
                        Add a new stimuli pool
                        <Link href="admin/pool/add">
                            <Button colorPalette="green" ml={4}>
                                <LuFilePlus />
                            </Button>
                        </Link>
                    </Heading>
                    <PoolSelect />
                    <ChakraLink asChild colorPalette="gray" alignSelf="end">
                        <Link href="admin/experiment/add" >
                            <Button colorPalette="blue" minW="30%">
                                <LuFlaskConical /> New Experiment
                            </Button>
                        </Link>
                    </ChakraLink>
                    <Heading size="4xl">Experiments:</Heading>
                    {exps.loading && <SkeletonText noOfLines={5} gap="4" />}
                    {!exps.loading &&
                        <Table.Root size="sm" variant="outline" interactive showColumnBorder>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader htmlWidth="30%">Name</Table.ColumnHeader>
                                    <Table.ColumnHeader htmlWidth="30%">Pool</Table.ColumnHeader>
                                    <Table.ColumnHeader htmlWidth="10%">Show Feedback</Table.ColumnHeader>
                                    <Table.ColumnHeader htmlWidth="10%"></Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {exps.value.map((exp) => (
                                    <Table.Row key={exp.experiment_id}>
                                        <Table.Cell>{exp.name}</Table.Cell>
                                        <Table.Cell>{exp.pool_id}</Table.Cell>
                                        <Table.Cell>{exp.feedback}</Table.Cell>
                                        {/* <Table.Cell><Button onClick={}><LuCirclePlay /> Session </Button></Table.Cell> */}
                                        <Table.Cell>
                                            <Dialog.Root
                                                placement="center"
                                                motionPreset="slide-in-bottom"
                                            >
                                                <Dialog.Trigger asChild>
                                                    <Button><LuCirclePlay /> Session </Button>
                                                </Dialog.Trigger>
                                                <Portal>
                                                    <Dialog.Backdrop />
                                                    <Dialog.Positioner>
                                                        <Dialog.Content>
                                                            <Dialog.Header>
                                                                <Dialog.Title>Insert the session name</Dialog.Title>
                                                            </Dialog.Header>
                                                            <Dialog.Body>
                                                                <Field.Root invalid={!validSessionName}>
                                                                    <Input value={sessionName} onChange={(e) => setSessionName(e.currentTarget.value)} />
                                                                    <Field.ErrorText>Invalid session name!</Field.ErrorText>
                                                                </Field.Root>
                                                            </Dialog.Body>
                                                            <Dialog.Footer>
                                                                <Dialog.ActionTrigger asChild>
                                                                    <Button variant="outline">Cancel</Button>
                                                                </Dialog.ActionTrigger>
                                                                <Button onClick={_ => handleStartSession(exp)}>Save</Button>
                                                            </Dialog.Footer>
                                                            <Dialog.CloseTrigger asChild>
                                                                <CloseButton size="sm" />
                                                            </Dialog.CloseTrigger>
                                                        </Dialog.Content>
                                                    </Dialog.Positioner>
                                                </Portal>
                                            </Dialog.Root>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    }
                    <Heading size="4xl">Sessions by user:</Heading>
                    <HStack>

                        <Select.Root collection={collectionSession} value={session}
                            onValueChange={async (e) => {
                                generateCsv(e.value);
                                // setSession(e.value);
                            }}>
                            <Select.HiddenSelect />
                            {/* <Select.Label>Available sessions</Select.Label> */}
                            <Select.Control>
                                <Select.Trigger>
                                    <Select.ValueText placeholder="Select a session" />
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                    {sessions.loading && (
                                        <Spinner size="xs" borderWidth="1.5px" color="fg.muted" />
                                    )}
                                    <Select.Indicator />
                                </Select.IndicatorGroup>
                            </Select.Control>
                            <Portal>
                                <Select.Positioner>
                                    <Select.Content>
                                        {collectionSession.items.map((e,idx) => (
                                            <Select.Item item={e.username} key={idx}>
                                                {e.username}
                                                <Select.ItemIndicator />
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Positioner>
                            </Portal>
                        </Select.Root>
                        {/* <Button onClick={e => generateCsv()}>Generate CSV</Button> */}
                    </HStack>

                </Flex >
            }
        </Container>
    )
}