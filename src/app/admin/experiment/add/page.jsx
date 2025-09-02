"use client"
import {
  Spinner, Container, Stack,
  Field, Input, Checkbox,
  Button, HStack, Select,
  Portal, createListCollection, NumberInput,
  For, Table, Flex,
  Center, Fieldset, CheckboxGroup,
  RadioGroup, Separator, Heading
} from "@chakra-ui/react"
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useController } from "react-hook-form"
import { ospfGetPools, ospfGetStimuli } from "../../../_utilities/ospf"
import { useAsync } from "react-use"
import { createExperiment } from "../../../_utilities/ExperimentService"
import { LuPlus, LuFlaskConical, LuTrash2 } from 'react-icons/lu'
import { useRouter } from 'next/navigation';

const block_types = createListCollection({
  items: [
    { label: "Relation", value: 0 },
    { label: "Reflexive", value: 1 },
    { label: "Symmetric", value: 2 },
    { label: "Transistive", value: 3 },
  ],
})

export default function Experiment() {
  const router = useRouter();
  const title = "Add a new experiment"
  useEffect(() => {
    document.title = title
  }, [title])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    control,
    setValue
  } = useForm();

  const [blocks, setBlocks] = useState([]);

  const poolId = useController({
    control: control,
    name: "poolId",
  });

  const accuracy = useController({
    control: control,
    name: "accuracy",
  });


  const stId = useController({
    control: control,
    name: "stId",
  });

  const related = useController({
    control: control,
    name: "related",
  });

  const [selBlock, setSelBlock] = useState(null);
  const [relation, setRelation] = useState({});

  useEffect(() => {
    setRelation({});
  }, [poolId]);

  const onSubmit = async (data) => {
    console.log("Creating new experiment");
    let new_blocks = [...blocks];

    if (selBlock !== null) {
      new_blocks[selBlock].rel = relation;
    }

    // console.log(new_blocks);

    const exp = {
      "name": data.name,
      "accuracy": data.accuracy,
      "pool_id": data.poolId[0]
    };
    console.log(exp);
    await createExperiment(exp, blocks, relation);
    router.push("/admin");
  };

  const [loading, setLoading] = useState(false);
  let pools = useAsync(async () => await ospfGetPools(), [loading]);
  let stimuli = useAsync(async () => {
    const st = await ospfGetStimuli(poolId.field.value[0]);
    return st;
  },
    [poolId]);

  const collection = useMemo(() => {
    return createListCollection({
      items: pools.value ?? [],
      itemToString: (p) => p,
      itemToValue: (p) => p,
    })
  }, [pools.value]);

  const addBlock = (e) => {
    // let block = { id: nextBlock, n_dist: 0, n_trials: 1, feedback: false, accuracy: false, rel: {} };
    let block = { n_dist: 0, n_trials: 1, feedback: false, accuracy: false, rel: {} };
    const new_blocks = [...blocks, block];
    setSelBlock(new_blocks.length - 1);
    setBlocks(new_blocks);
    setValue("stId", null);
    setValue("related", undefined);
  };

  const updateBlockNDist = (block_idx, n_dist) => {
    let new_blocks = blocks.map((block, idx) =>
      idx === block_idx ? { ...block, n_dist: n_dist } : block
    )
    setBlocks(new_blocks);
  };

  const updateBlockNTrials = (block_idx, n_trials) => {
    let new_blocks = blocks.map((block, idx) =>
      idx === block_idx ? { ...block, n_trials: n_trials } : block
    )
    setBlocks(new_blocks);
  };

  const updateBlockType = (block_idx, type) => {
    let new_blocks = blocks.map((block, idx) =>
      idx === block_idx ? { ...block, type: type } : block
    )
    setBlocks(new_blocks);
  };

  const updateBlockRel = (block_idx, rel) => {
    let new_blocks = blocks.map((block, idx) =>
      idx === block_idx ? { ...block, rel: rel } : block
    )
    setBlocks(new_blocks);
  };

  const updateBlockFeedback = (block_idx, feedback) => {
    let new_blocks = blocks.map((block, idx) =>
      idx === block_idx ? { ...block, feedback: feedback } : block
    )
    setBlocks(new_blocks);
  };

  const updateBlockAccuracy = (block_idx, accuracy) => {
    let new_blocks = blocks.map((block, idx) =>
      idx === block_idx ? { ...block, accuracy: accuracy } : block
    )
    setBlocks(new_blocks);
  };

  const handleTableClick = (block_idx) => {
    updateBlockRel(selBlock, relation);
    setSelBlock(block_idx);
    setRelation(blocks[block_idx].rel);
    setValue("stId", null);
    setValue("related", []);
  };

  const deleteBlock = (block_idx) => {
    const new_blocks = [...blocks.slice(0, block_idx), ...blocks.slice(block_idx + 1)];
    setBlocks(new_blocks);
    setSelBlock(null);
    setValue("stId", null);
    setValue("related", []);
  };

  return <Container>
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack>
        <Field.Root invalid={!!errors.name}>
          <Field.Label>Experiment name</Field.Label>
          <Input {...register("name", { required: true })} />
          <Field.ErrorText>Experiment name required!</Field.ErrorText>
        </Field.Root>
        <Field.Root invalid={!!errors.poolId}>
          <Field.Label>Select a stimuli pool</Field.Label>
          <Controller
            control={control}
            name="poolId"
            rules={{ required: true }}
            render={({ field }) => (
              <Select.Root collection={collection} name={field.name} value={field.value}
                onInteractOutside={() => field.onBlur()}
                onValueChange={({ value }) => field.onChange(value)}
              >
                <Select.HiddenSelect />
                <Select.Label>Stimuli pool</Select.Label>
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Select a stimuli pool" />
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
                      {collection.items.map((pool) => (
                        <Select.Item item={pool} key={pool}>
                          {pool}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            )} />
          <Field.ErrorText>Please, select a stimuli pool.</Field.ErrorText>
        </Field.Root>
        <HStack>
          <Controller
            control={control}
            name="accuracy"
            render={({ field }) => (
              <Field.Root>
                <Checkbox.Root checked={field.value} onCheckedChange={({ checked }) => field.onChange(checked)}>
                  <Checkbox.HiddenInput {...register("accuracy")} />
                  <Checkbox.Control />
                  <Checkbox.Label>Show accuracy</Checkbox.Label>
                </Checkbox.Root>
              </Field.Root>
            )}
          />
        </HStack>
        <Separator size="lg" />
        {poolId.field.value === undefined && <Heading size="4xl">Select a stimuli pool!</Heading>}
        {poolId.field.value !== undefined &&
          <Stack gap="10">
            <Heading size="4xl">Blocks <Button colorPalette="green" onClick={addBlock}> <LuPlus /> Add a new block</Button></Heading>
            <Table.Root size="sm" variant="outline" interactive showColumnBorder>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader textAlign="center" htmlWidth="5%"></Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center" htmlWidth="5%">Block</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center" htmlWidth="20%"># of trials</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center" htmlWidth="20%"># of distractors</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center" htmlWidth="20%">Type</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center" htmlWidth="10%">Feedback</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center" htmlWidth="10%">Accuracy</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center" htmlWidth="10%"></Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {blocks.map((block, block_idx) => (
                  // <Table.Row key={block.id} onClick={() => handleTableClick(block_idx)}  data-selected={selBlock === block_idx ? "" : undefined}>
                  <Table.Row key={block_idx} data-selected={selBlock === block_idx ? "" : undefined}>
                    <Table.Cell>
                      <Center>
                        <RadioGroup.Root value={selBlock}>
                          <RadioGroup.Item key={block_idx} value={block_idx} onClick={() => handleTableClick(block_idx)}>
                            <RadioGroup.ItemHiddenInput />
                            <RadioGroup.ItemIndicator />
                          </RadioGroup.Item>
                        </RadioGroup.Root>
                      </Center>
                    </Table.Cell>
                    <Table.Cell textAlign="center">{block_idx + 1}</Table.Cell>
                    <Table.Cell>
                      <NumberInput.Root defaultValue={1} min={1} onValueChange={(e) => updateBlockNTrials(block_idx, parseInt(e.value))}>
                        <NumberInput.Control>
                          <NumberInput.IncrementTrigger />
                          <NumberInput.DecrementTrigger />
                        </NumberInput.Control>
                        <NumberInput.Scrubber />
                        <NumberInput.Input />
                      </NumberInput.Root>
                    </Table.Cell>
                    <Table.Cell>
                      <NumberInput.Root defaultValue={0} min={0} max={stimuli.value.length - 1} onValueChange={(e) => updateBlockNDist(block_idx, parseInt(e.value))}>
                        <NumberInput.Control>
                          <NumberInput.IncrementTrigger />
                          <NumberInput.DecrementTrigger />
                        </NumberInput.Control>
                        <NumberInput.Scrubber />
                        <NumberInput.Input />
                      </NumberInput.Root>
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      <Select.Root required collection={block_types} size="sm" onValueChange={(e) => updateBlockType(block_idx, e.value[0])}>
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="Select the block type" />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {block_types.items.map((type) => (
                                <Select.Item item={type} key={type.value}>
                                  {type.label}
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Checkbox.Root
                        checked={block.feedback}
                        onCheckedChange={(e) => updateBlockFeedback(block_idx, !!e.checked)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                      </Checkbox.Root>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Checkbox.Root
                        checked={block.accuracy}
                        onCheckedChange={(e) => updateBlockAccuracy(block_idx, !!e.checked)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                      </Checkbox.Root>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Button colorPalette="red" size="sm" onClick={(e) => deleteBlock(block_idx)}> <LuTrash2 /> </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Stack>
        }
        <Separator size="lg" />
        {/* {selBlock === null && <Heading size="4xl">Select a block to define its relation</Heading>} */}
        {selBlock !== null && <Container>
          <Heading size="4xl">Define the train relation for block #{selBlock + 1}</Heading>
          {poolId.field.value === undefined && <Heading size="4xl">Select a pool to define the train relation for block #{selBlock + 1}</Heading>}
          {poolId.field.value !== undefined &&
            <Flex mt={4} direction="row" justify="center" gap="4">
              <Fieldset.Root>
                <Fieldset.Legend>Select a stimulus</Fieldset.Legend>
                <Controller
                  name="stId"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup.Root
                      name={field.name}
                      value={field.value}
                      onValueChange={({ value }) => {
                        // related.field.value = relation[value]
                        related.field.value = relation[value] !== undefined ? relation[value] : []
                        field.onChange(value)
                      }}
                    >
                      <HStack gap="6">
                        {poolId.field.value && !stimuli.loading && !stimuli.error && stimuli.value.map((item) => (
                          <RadioGroup.Item key={item} value={item}>
                            <RadioGroup.ItemHiddenInput onBlur={field.onBlur} />
                            <RadioGroup.ItemIndicator />
                            <RadioGroup.ItemText>{item}</RadioGroup.ItemText>
                          </RadioGroup.Item>
                        ))}
                      </HStack>
                    </RadioGroup.Root>
                  )} />
              </Fieldset.Root>
              {stId.field.value !== undefined &&
                <Fieldset.Root>
                  <Fieldset.Legend>Select related stimuli</Fieldset.Legend>
                  <CheckboxGroup width="50%"
                    value={related.field.value}
                    onValueChange={(e) => {
                      let old_rel = relation;
                      old_rel[stId.field.value] = e;
                      setRelation(old_rel)
                      return related.field.onChange(e)
                    }}
                    name={related.field.name}
                  >
                    <Fieldset.Content>
                      {poolId.field.value && !stimuli.loading && !stimuli.error && stimuli.value.map((item) => (
                        <Checkbox.Root key={item} value={item}>
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>{item}</Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </Fieldset.Content>
                  </CheckboxGroup>
                </Fieldset.Root>}
            </Flex>}
        </Container>
        }
        <Button colorPalette="blue" type="submit"> <LuFlaskConical /> Create new experiment</Button>
      </Stack>
    </form>
  </Container >
}