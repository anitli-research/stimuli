"use client"
import { useRouter } from 'next/navigation';
import Form from 'next/form'
import {
  Flex,
  Box,
  Heading,
  Field,
  Input,
  Button,
  FileUpload,
  Icon,
  useFileUploadContext,
  Float,
  Circle,
} from "@chakra-ui/react"
import { toaster } from "@/components/ui/toaster"
import { LuUpload, LuX } from 'react-icons/lu'
import { createPool } from "../../../_utilities/PoolService"
import { useState } from "react"

const PreviewList = () => {
  const fileUpload = useFileUploadContext()
  const files = fileUpload.acceptedFiles
  // Check for duplicates
  if (files.length === 0) return null
  return (
    <FileUpload.ItemGroup>
      {files.map((file) => (
        <FileUpload.Item
          w="auto"
          boxSize="20"
          p="2"
          file={file}
          key={file.name}
        >
          <FileUpload.ItemPreviewImage maxHeight={"100%"} />
          <Float placement="top-end">
            <FileUpload.ItemDeleteTrigger boxSize="4">
              <Circle size="5" bg="bg.inverted" color="red">
                <LuX />
              </Circle>
            </FileUpload.ItemDeleteTrigger>
          </Float>
        </FileUpload.Item>
      ))}
    </FileUpload.ItemGroup>
  )
}

const FileForm = () => {
  const router = useRouter();
  const fileUpload = useFileUploadContext();
  const [l, setL] = useState(false);

  const submit = async (formData) => {

    setL(true);
    const poolId = formData.get("poolId");
    createPool(poolId, fileUpload.acceptedFiles).then(res => {
      if (res) {
        toaster.create({
          description: "Pool created successfully",
          type: "success",
          // type: "loading"
        })
        setL(false);
        router.push('/admin');
      } else {
        toaster.create({
          description: "Invalid request, try again",
          type: "error",
        });
        setL(false);
      }
    }).catch(_ => {
      toaster.create({
        description: "Could not connect with the server",
        type: "error",
      });
      setL(false);
    });
  }
  return (
    <Form action={submit}>
      <Flex direction="column" gap="4">
        <Field.Root required>
          <Field.Label>
            <Heading>Name</Heading>
            <Field.RequiredIndicator />
          </Field.Label>
          <Input name='poolId' />
        </Field.Root>

        <FileUpload.RootProvider value={fileUpload} accept="image/*" alignItems="stretch">
          <FileUpload.Label><Heading>Stimuli</Heading></FileUpload.Label>
          <FileUpload.HiddenInput />
          <FileUpload.Dropzone>
            <Icon size="md" color="fg.muted">
              <LuUpload />
            </Icon>
            <FileUpload.DropzoneContent>
              <Box>Drag and drop files here</Box>
              <Box color="fg.muted">.png, .jpg up to 5MB</Box>
            </FileUpload.DropzoneContent>
          </FileUpload.Dropzone>

          <PreviewList />
        </FileUpload.RootProvider >

        <Box display="flex" justifyContent="flex-end" mt={4}>
          <Button loading={l} type="submit" alignSelf={'cross-end'} justifySelf={'cross-end'} >
            Submit
          </Button>
        </Box>
      </Flex>
    </Form >
  )

}

export default function Pool() {
  return (
    <Flex direction="column" justify="center" gap="4">
      <Heading size="4xl" fontWeight="bold" textAlign="center">Create a new stimuli pool</Heading>
      <FileUpload.Root accept="image/*" alignItems="stretch" maxFiles={100}>
        <FileForm />
      </FileUpload.Root>
    </Flex >
  )
}