import axios, { isAxiosError } from "axios";
import { CV_ENRICHMENT_API_URL } from "./cv.service";

const client = axios.create({
    baseURL: CV_ENRICHMENT_API_URL,
    timeout: 15000
});

export type AIProviderType = "gemini" | "openai" | "openai-compatible";

export interface PublicSettings {
    isConfigured: boolean;
    provider: AIProviderType;
    model: string;
    baseUrl: string;
    hasApiKey: boolean;
    apiKeyPreview: string | null;
    updatedAt: number | null;
}

export interface UpdateSettingsPayload {
    provider: AIProviderType;
    apiKey?: string;
    model: string;
    baseUrl?: string;
}

export interface TestConnectionPayload {
    provider: AIProviderType;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
}

export interface TestConnectionResponse {
    ok: boolean;
    message: string;
    provider: AIProviderType;
    model: string;
}

export interface ListModelsPayload {
    provider: AIProviderType;
    apiKey?: string;
    baseUrl?: string;
}

export interface SettingsError {
    code: "network-error" | "bad-request" | "server-error";
    message: string;
}

export async function getSettings(): Promise<Result<SettingsError, PublicSettings>> {
    try {
        const response = await client.get<PublicSettings>("/settings");
        return { data: response.data };
    } catch (error: unknown) {
        return { err: parseSettingsError(error) };
    }
}

export async function updateSettings(
    payload: UpdateSettingsPayload
): Promise<Result<SettingsError, PublicSettings>> {
    try {
        const response = await client.put<PublicSettings>("/settings", payload);
        return { data: response.data };
    } catch (error: unknown) {
        return { err: parseSettingsError(error) };
    }
}

export async function testSettingsConnection(
    payload: TestConnectionPayload
): Promise<Result<SettingsError, TestConnectionResponse>> {
    try {
        const response = await client.post<TestConnectionResponse>("/settings/test", payload);
        return { data: response.data };
    } catch (error: unknown) {
        return { err: parseSettingsError(error) };
    }
}

export async function fetchProviderModels(
    payload: ListModelsPayload
): Promise<Result<SettingsError, string[]>> {
    try {
        const response = await client.post<{ models: string[] }>("/settings/models", payload);
        return { data: response.data.models };
    } catch (error: unknown) {
        return { err: parseSettingsError(error) };
    }
}

function parseSettingsError(error: unknown): SettingsError {
    if (isAxiosError(error)) {
        if (!error.response) {
            return {
                code: "network-error",
                message: "Não foi possível conectar ao servidor da API. Verifique se o backend está em execução."
            };
        }

        const data = error.response.data as { error?: string; message?: string } | undefined;
        const msg = data?.error || data?.message || error.message;

        if (error.response.status === 400) {
            return {
                code: "bad-request",
                message: msg || "Dados de configuração inválidos."
            };
        }

        return {
            code: "server-error",
            message: msg || "Erro interno ao processar configurações de IA."
        };
    }

    return {
        code: "server-error",
        message: error instanceof Error ? error.message : "Erro desconhecido ao comunicar com a API."
    };
}
