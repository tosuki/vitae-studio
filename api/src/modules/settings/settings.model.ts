export type AIProviderType = "gemini" | "openai" | "openai-compatible";

export const DEFAULT_PROVIDER_MODELS: Record<AIProviderType, string> = {
    gemini: "gemini-2.5-flash",
    openai: "gpt-4o-mini",
    "openai-compatible": "gpt-4o-mini"
};

export const DEFAULT_PROVIDER_BASE_URLS: Record<AIProviderType, string> = {
    gemini: "",
    openai: "https://api.openai.com/v1",
    "openai-compatible": "http://localhost:20128/v1"
};

export interface AppSettings {
    provider: AIProviderType;
    apiKey: string;
    model: string;
    baseUrl?: string;
    updatedAt: number;
}

export interface PublicSettingsDTO {
    isConfigured: boolean;
    provider: AIProviderType;
    model: string;
    baseUrl: string;
    hasApiKey: boolean;
    apiKeyPreview: string | null;
    updatedAt: number | null;
}

export interface UpdateSettingsDTO {
    provider: AIProviderType;
    apiKey?: string;
    model: string;
    baseUrl?: string;
}

export interface TestConnectionDTO {
    provider: AIProviderType;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
}

export interface TestConnectionResponseDTO {
    ok: boolean;
    message: string;
    provider: AIProviderType;
    model: string;
}

export interface ListModelsDTO {
    provider: AIProviderType;
    apiKey?: string;
    baseUrl?: string;
}

export interface ListModelsResponseDTO {
    models: string[];
}
