import { ReactNode, useState } from "react"

import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query"
import { CVData } from "../types/cv.model"
import { isAxiosError } from "axios"

const client = new QueryClient()

export async function EnrichmentProvider({ children }: { children?: ReactNode }) {
    return (
        <QueryClientProvider client={ client }>
            { children }
        </QueryClientProvider>
    )
}

export function useEnrichment(cv: CVData, linkedinJobId: string) {
    const [data, setData] = useState<CVData | null>(null)

    const mutation = useMutation({
        mutationFn: async () => {
            
        },
        onError: (error, opts) => {
            if (isAxiosError(error)) {

            }
        }
    })
}