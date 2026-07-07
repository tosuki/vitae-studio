import { ReactNode, useState } from "react"
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query"
import { CVData } from "../types/cv.model"
import { createEnrichmentTask, getEnrichmentTask, TaskStatus, TaskResponse } from "../service/cv.service"

const client = new QueryClient()

export function EnrichmentProvider({ children }: { children?: ReactNode }) {
    return (
        <QueryClientProvider client={ client }>
            { children }
        </QueryClientProvider>
    )
}

export function useEnrichment() {
    const [taskId, setTaskId] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const createMutation = useMutation({
        mutationFn: async ({ linkedinJobId, cv }: { linkedinJobId: string; cv: CVData }) => {
            setErrorMsg(null)
            const result = await createEnrichmentTask(linkedinJobId, cv)
            if (result.err) {
                throw new Error(result.err.message)
            }
            return result.data
        },
        onSuccess: (data) => {
            if (data && data.id) {
                setTaskId(data.id)
            }
        },
        onError: (err: any) => {
            setErrorMsg(err.message || "Falha ao iniciar a tarefa de enriquecimento.")
        }
    })

    const taskQuery = useQuery({
        queryKey: ['enrichment-task', taskId],
        queryFn: async () => {
            if (!taskId) return null
            const result = await getEnrichmentTask(taskId)
            if (result.err) {
                throw new Error(result.err.message)
            }
            return result.data
        },
        enabled: !!taskId,
        refetchInterval: (query) => {
            const task = query.state.data
            if (!task) return 2000
            if (task.status === 'DONE' || task.status === 'FAILED') {
                return false
            }
            return 2000
        }
    })

    const taskData: TaskResponse | null = taskQuery.data || null
    const currentStatus: TaskStatus | 'IDLE' = createMutation.isPending
        ? 'PENDING'
        : taskData
        ? taskData.status
        : 'IDLE'

    let progress = 0
    let statusLabel = ""

    if (createMutation.isPending) {
        progress = 5
        statusLabel = "Enviando currículo ao servidor..."
    } else if (createMutation.isError) {
        progress = 100
        statusLabel = errorMsg || "Erro ao conectar com a API."
    } else if (taskData) {
        switch (taskData.status) {
            case 'PENDING':
                progress = 15
                statusLabel = "Aguardando na fila de processamento..."
                break
            case 'EXTRACTING_LINKEDIN':
                progress = 45
                statusLabel = "Buscando dados da vaga no LinkedIn..."
                break
            case 'EXTRACTING_GEMINI':
                progress = 75
                statusLabel = "Analisando requisitos e otimizando o currículo com Gemini..."
                break
            case 'DONE':
                progress = 100
                statusLabel = "Currículo otimizado com sucesso!"
                break
            case 'FAILED':
                progress = 100
                statusLabel = taskData.errorMessage || "Ocorreu um erro no processamento da tarefa."
                break
            default:
                progress = 0
                statusLabel = ""
        }
    }

    const startEnrichment = (linkedinJobId: string, cv: CVData) => {
        setTaskId(null)
        setErrorMsg(null)
        createMutation.mutate({ linkedinJobId, cv })
    }

    const reset = () => {
        setTaskId(null)
        setErrorMsg(null)
        createMutation.reset()
    }

    const isPending = createMutation.isPending || (!!taskId && taskData?.status !== 'DONE' && taskData?.status !== 'FAILED')
    const isSuccess = taskData?.status === 'DONE'
    const isError = createMutation.isError || taskData?.status === 'FAILED'
    const finalError = errorMsg || (taskData?.status === 'FAILED' ? taskData.errorMessage : null)

    return {
        startEnrichment,
        reset,
        status: currentStatus,
        progress,
        statusLabel,
        isPending,
        isSuccess,
        isError,
        errorMessage: finalError,
        enrichedCV: taskData?.enrichedCV || null
    }
}