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
import { LuPlus, LuFlaskConical } from 'react-icons/lu'
import { useRouter } from 'next/navigation';

const items = [
  { block_idx: 1, type: "rel", n_dist: 2 },
]

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
    control
  } = useForm();

  const [nextBlock, setNextBlock] = useState(1);
  const [blocks, setBlocks] = useState([]);

  const feedback = useController({
    control: control,
    name: "feedback",
  });

  const poolId = useController({
    control: control,
    name: "poolId",
  });

  const stId = useController({
    control: control,
    name: "stId",
  });

  const related = useController({
    control: control,
    name: "related",
  });

  const [relation, setRelation] = useState({});

  const onSubmit = async (data) => {
    console.log("Creating new experiment");
    console.log(data);
    console.log(blocks);
    const exp = {
      "name": data.name,
      "feedback": data.feedback,
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
    console.log("Adding new");
    console.log(blocks);
    // let block =  { block_idx: nextBlock, type: "rel", n_dist: 2 };
    let block = { block_idx: nextBlock, n_dist: 1, n_trials: 1 };
    console.log([...blocks, block]);
    setNextBlock(nextBlock + 1);
    setBlocks([...blocks, block]);
  };

  const updateBlockNDist = (block_idx, n_dist) => {
    let new_blocks = blocks.map((block) =>
      block.block_idx === block_idx ? { ...block, n_dist: n_dist } : block
    )
    console.log(new_blocks);
    setBlocks(new_blocks);
  };

  const updateBlockNTrials = (block_idx, n_trials) => {
    let new_blocks = blocks.map((block) =>
      block.block_idx === block_idx ? { ...block, n_trials: n_trials } : block
    )
    console.log(new_blocks);
    setBlocks(new_blocks);
  };

  const updateBlockType = (block_idx, type) => {
    let new_blocks = blocks.map((block) =>
      block.block_idx === block_idx ? { ...block, type: type } : block
    )
    console.log(new_blocks);
    setBlocks(new_blocks);
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
            name="feedback"
            render={({ field }) => (
              <Field.Root>
                <Checkbox.Root checked={field.value} onCheckedChange={({ checked }) => field.onChange(checked)}>
                  <Checkbox.HiddenInput {...register("feedback")} />
                  <Checkbox.Control />
                  <Checkbox.Label>Show feedback</Checkbox.Label>
                </Checkbox.Root>
              </Field.Root>
            )}
          />
        </HStack>
        <Separator size="lg" />
        <Heading size="4xl">Define the stimuli relation</Heading>
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
          </Fieldset.Root>
        </Flex>
        <Separator size="lg" />
        <Stack gap="10">
          <Heading size="4xl">Blocks <Button colorPalette="green" onClick={addBlock}> <LuPlus /> Add a new block</Button></Heading> 
          <Table.Root size="sm" variant="outline" interactive showColumnBorder>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader htmlWidth="10%">Block #</Table.ColumnHeader>
                <Table.ColumnHeader htmlWidth="25%"># of trials</Table.ColumnHeader>
                <Table.ColumnHeader htmlWidth="25%"># of distractors</Table.ColumnHeader>
                <Table.ColumnHeader htmlWidth="40%">Type</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {blocks.map((block) => (
                <Table.Row key={block.block_idx}>
                  <Table.Cell>{block.block_idx}</Table.Cell>
                  <Table.Cell>
                    <NumberInput.Root defaultValue={1} min={1} onValueChange={(e) => updateBlockNTrials(block.block_idx, parseInt(e.value))}>
                      <NumberInput.Control>
                        <NumberInput.IncrementTrigger />
                        <NumberInput.DecrementTrigger />
                      </NumberInput.Control>
                      <NumberInput.Scrubber />
                      <NumberInput.Input />
                    </NumberInput.Root>
                  </Table.Cell>
                  <Table.Cell>
                    <NumberInput.Root defaultValue={1} min={1} onValueChange={(e) => updateBlockNDist(block.block_idx, parseInt(e.value))}>
                      <NumberInput.Control>
                        <NumberInput.IncrementTrigger />
                        <NumberInput.DecrementTrigger />
                      </NumberInput.Control>
                      <NumberInput.Scrubber />
                      <NumberInput.Input />
                    </NumberInput.Root>
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <Select.Root required collection={block_types} size="sm" onValueChange={(e) => updateBlockType(block.block_idx, e.value[0])}>
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
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Stack>

        <Button colorPalette="blue" type="submit"> <LuFlaskConical /> Create new experiment</Button>
      </Stack>
    </form>
  </Container >
}