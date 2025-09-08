"use client"
import { Suspense } from 'react'
import { SkeletonText } from "@chakra-ui/react"
import Session from '@/components/session'

export default function Page() {
    return <Suspense fallback={<SkeletonText noOfLines={10} gap="4" />}>
        <Session />
    </Suspense>

}