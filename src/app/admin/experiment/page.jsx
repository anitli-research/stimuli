"use client"
import { Suspense } from 'react'
import { SkeletonText } from "@chakra-ui/react"
import Experiment from '@/components/experiment'

export default function Page() {
  return <Suspense fallback={<SkeletonText noOfLines={10} gap="4" />}>
    <Experiment />
  </Suspense>
}