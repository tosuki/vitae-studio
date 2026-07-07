import { ApiError } from "@google/genai";
import { getGeminiClient } from "../factory";
import {
    GeminiQuotaExhaustedError,
    GeminiInvalidResponseError,
    ConfigurationError
} from "../../../util/errors";

import { LinkedinJob } from "../model/linkedin-job.model";
import { CVResponseSchema } from "./gemini.schema"
import { CVData } from "../model/cv.model";

import { ENRICHMENT_GEMINI_PROMPT } from "./gemini.prompt"

export async function enrichCVWithGemini(rawHtml: string, cv: CVData): Promise<Result<GeminiQuotaExhaustedError | GeminiInvalidResponseError | ConfigurationError, Omit<CVData, "style">>> {
    const prompt = ENRICHMENT_GEMINI_PROMPT(cv, rawHtml)

    try {
        const ai = getGeminiClient()

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: CVResponseSchema,
            }
        })

        if (!response.text) {
            return { err: new GeminiInvalidResponseError("Não foi possível obter resposta em texto do Gemini.") };
        }

        const partialCV: Omit<CVData, "style"> = JSON.parse(response.text)

        return {
            data: partialCV
        }
    } catch (error: any) {
        return handleGeminiError(error)
    }
}

export function handleGeminiError(error: any) {
    if (error instanceof ConfigurationError) {
        return { err: error }
    }

    if (error instanceof ApiError && error.status === 429) {
        return { err: new GeminiQuotaExhaustedError() };
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
