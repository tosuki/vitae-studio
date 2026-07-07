import axios, { isAxiosError } from "axios"
import { CVData } from "../types/cv.model"

export const CV_ENRICHMENT_API_URL = "http://localhost:3000"

const client = axios.create({
    baseURL: CV_ENRICHMENT_API_URL
})

export type TaskStatus = 'PENDING' | 'EXTRACTING_LINKEDIN' | 'EXTRACTING_GEMINI' | 'DONE' | 'FAILED';

export interface TaskResponse {
    id: string;
    status: TaskStatus;
    linkedinJobId: string;
    enrichedCV: Omit<CVData, "style"> | null;
    errorMessage: string | null;
    updatedAt: number;
}

export type EnrichmentError = 
    | { code: "network-error"; message: string }
    | { code: "api-unavailable"; message: string }
    | { code: "bad-request"; message: string }
    | { code: "not-found"; message: string }
    | { code: "unknown-error"; message: string };

export async function createEnrichmentTask(linkedinJobId: string, cv: CVData): Promise<Result<EnrichmentError, TaskResponse>> {
    try {
        const response = await client.post<TaskResponse>('/tasks', {
            linkedinJobId: linkedinJobId,
            cv: cv,
        })

        return { data: response.data }
    } catch (error: unknown) {
        return { err: handleAxiosError(error) }
    }
}

export async function getEnrichmentTask(taskId: string): Promise<Result<EnrichmentError, TaskResponse>> {
    try {
        const response = await client.get<TaskResponse>(`/tasks/${taskId}`)
        return { data: response.data }
    } catch (error: unknown) {
        return { err: handleAxiosError(error) }
    }
}

function handleAxiosError(error: unknown): EnrichmentError {
    if (isAxiosError(error)) {
        if (!error.response) {
            return { 
                code: "network-error", 
                message: "Não foi possível conectar ao servidor. Verifique sua conexão ou se a API está rodando." 
            }
        }

        const status = error.response.status
        const responseData = error.response.data as any
        const msg = responseData?.message || responseData?.error || error.message

        if (status === 400) {
            return { 
                code: "bad-request", 
                message: msg || "Dados de entrada inválidos. Verifique as informações enviadas." 
            }
        }

        if (status === 404) {
            return { 
                code: "not-found", 
                message: msg || "Tarefa não encontrada no servidor." 
            }
        }

        if (status >= 500) {
            return { 
                code: "api-unavailable", 
                message: msg || "Servidor do enriquecimento enfrentou um erro interno e está indisponível." 
            }
        }

        return { 
            code: "unknown-error", 
            message: msg || "Erro inesperado na resposta do servidor." 
        }
    }

    return { 
        code: "unknown-error", 
        message: error instanceof Error ? error.message : "Erro desconhecido na requisição." 
    }
}