import { ApiError } from "@google/genai";
import { getGeminiClient, getSettingsService } from "../factory";
import {
    GeminiQuotaExhaustedError,
    GeminiInvalidResponseError,
    ConfigurationError
} from "../../../util/errors";

import { LinkedinJob } from "../model/linkedin-job.model";
import { CVResponseSchema } from "./gemini.schema";
import { CVData } from "../../common/model/cv.model";

import { ENRICHMENT_GEMINI_PROMPT } from "./gemini.prompt";
import {
    enrichCVWithOpenAICompatible,
    extractJsonFromText,
    normalizeEnrichedCV
} from "../ai/openai-compatible.provider";
import {
    DEFAULT_PROVIDER_BASE_URLS,
    DEFAULT_PROVIDER_MODELS
} from "../../settings/settings.model";

export async function enrichCVWithAI(
    rawHtml: string,
    cv: CVData
): Promise<Result<GeminiQuotaExhaustedError | GeminiInvalidResponseError | ConfigurationError, Omit<CVData, "style">>> {
    const settingsService = getSettingsService();
    const settings = await settingsService.getSettings();

    if (!settings || !settingsService.isSettingsConfigured(settings)) {
        return {
            err: new ConfigurationError(
                "Nenhum provedor de IA está configurado. Acesse o botão 'Configurar IA' no topo da plataforma para informar sua API Key."
            )
        };
    }

    if (settings.provider === "gemini") {
        return enrichCVWithGemini(
            rawHtml,
            cv,
            settings.apiKey,
            settings.model || DEFAULT_PROVIDER_MODELS.gemini
        );
    }

    const baseUrl =
        settings.provider === "openai"
            ? settings.baseUrl || DEFAULT_PROVIDER_BASE_URLS.openai
            : settings.baseUrl || DEFAULT_PROVIDER_BASE_URLS["openai-compatible"];

    return enrichCVWithOpenAICompatible({
        rawHtml,
        cv,
        apiKey: settings.apiKey,
        model: settings.model || DEFAULT_PROVIDER_MODELS[settings.provider],
        baseUrl
    });
}

export async function enrichCVWithGemini(
    rawHtml: string,
    cv: CVData,
    customApiKey?: string,
    customModel?: string
): Promise<Result<GeminiQuotaExhaustedError | GeminiInvalidResponseError | ConfigurationError, Omit<CVData, "style">>> {
    const prompt = ENRICHMENT_GEMINI_PROMPT(cv, rawHtml);

    try {
        const ai = getGeminiClient(customApiKey);
        const model = (customModel || DEFAULT_PROVIDER_MODELS.gemini).trim();

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: CVResponseSchema
            }
        });

        if (!response.text) {
            return { err: new GeminiInvalidResponseError("Não foi possível obter resposta em texto do Gemini.") };
        }

        const parsed = extractJsonFromText(response.text);
        const partialCV = normalizeEnrichedCV(parsed, cv);

        return {
            data: partialCV
        };
    } catch (error: any) {
        return handleGeminiError(error);
    }
}

export function handleGeminiError(error: any) {
    if (error instanceof ConfigurationError) {
        return { err: error };
    }

    const errorMsg = String(error?.message || "");

    if (error instanceof ApiError && error.status === 429) {
        return { err: new GeminiQuotaExhaustedError() };
    }

    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
        return { err: new GeminiQuotaExhaustedError() };
    }

    if (
        errorMsg.includes("504") ||
        errorMsg.includes("DEADLINE_EXCEEDED") ||
        errorMsg.includes("aborted") ||
        errorMsg.includes("timeout")
    ) {
        return {
            err: new GeminiInvalidResponseError(
                "O modelo do Gemini demorou muito para responder e expirou o tempo limite. Recomendamos selecionar um modelo mais ágil (como gemini-3.5-flash-lite ou gemini-2.5-flash) nas configurações."
            )
        };
    }

    if (errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("UNAVAILABLE")) {
        return {
            err: new GeminiInvalidResponseError(
                "O modelo do Gemini está com alta demanda momentânea nos servidores da Google. Tente novamente em instantes ou utilize o modelo gemini-3.5-flash-lite."
            )
        };
    }

    if (error instanceof ApiError && (error.status === 400 || error.status === 401 || error.status === 403)) {
        return { err: new ConfigurationError(`Erro de configuração/autenticação no Gemini (${error.status}): ${error.message}`) };
    }

    return { err: new GeminiInvalidResponseError(error.message || "Erro desconhecido na integração com o Gemini") };
}

export async function extractJobInfoWithGemini(
    rawHtml: string
): Promise<Result<GeminiQuotaExhaustedError | GeminiInvalidResponseError | ConfigurationError, LinkedinJob>> {
    try {
        const ai = getGeminiClient();

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "",
            config: {
                responseMimeType: "application/json",
                responseSchema: CVResponseSchema
            }
        });

        if (!response.text) {
            return { err: new GeminiInvalidResponseError("Não foi possível obter resposta em texto do Gemini.") };
        }

        throw new Error("TO DO")

    } catch (error: any) {
        return handleGeminiError(error)
    }
}
