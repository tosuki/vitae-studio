import axios, { isAxiosError } from "axios";
import { CVData } from "../../common/model/cv.model";
import { ENRICHMENT_GEMINI_PROMPT } from "../gemini/gemini.prompt";
import { enrichedCVSchema } from "../../http/schema/task.schema";
import {
    ConfigurationError,
    GeminiInvalidResponseError,
    GeminiQuotaExhaustedError
} from "../../../util/errors";

export function normalizeBaseUrl(baseUrl: string): string {
    return baseUrl
        .trim()
        .replace(/\/+$/, "")
        .replace(/\/chat\/completions$/i, "")
        .replace(/\/models$/i, "")
        .replace(/\/+$/, "");
}

function buildAuthHeaders(apiKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json"
    };

    if (apiKey && apiKey.trim() !== "") {
        headers["Authorization"] = `Bearer ${apiKey.trim()}`;
    }

    return headers;
}

export function extractJsonFromText(rawText: string): unknown {
    let cleaned = rawText
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim();

    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
        cleaned = fenceMatch[1].trim();
    } else {
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.slice(firstBrace, lastBrace + 1);
        }
    }

    return JSON.parse(cleaned);
}

export function normalizeEnrichedCV(raw: any, originalCv: CVData): Omit<CVData, "style"> {
    const asStr = (val: unknown, fallback = ""): string =>
        typeof val === "string" ? val : val != null ? String(val) : fallback;

    const personalRaw = raw?.personal && typeof raw.personal === "object" ? raw.personal : {};
    const personal = {
        fullName: asStr(personalRaw.fullName, originalCv.personal.fullName),
        title: asStr(personalRaw.title, originalCv.personal.title),
        email: asStr(personalRaw.email, originalCv.personal.email),
        phone: asStr(personalRaw.phone, originalCv.personal.phone),
        location: asStr(personalRaw.location, originalCv.personal.location),
        linkedin: asStr(personalRaw.linkedin, originalCv.personal.linkedin),
        github: asStr(personalRaw.github, originalCv.personal.github)
    };

    const experience = Array.isArray(raw?.experience)
        ? raw.experience.map((item: any, idx: number) => ({
            id: asStr(item?.id, originalCv.experience[idx]?.id || String(idx + 1)),
            company: asStr(item?.company),
            role: asStr(item?.role),
            location: asStr(item?.location),
            startDate: asStr(item?.startDate),
            endDate: asStr(item?.endDate),
            description: asStr(item?.description)
        }))
        : originalCv.experience;

    const education = Array.isArray(raw?.education)
        ? raw.education.map((item: any, idx: number) => ({
            id: asStr(item?.id, originalCv.education[idx]?.id || String(idx + 1)),
            institution: asStr(item?.institution),
            degree: asStr(item?.degree),
            startDate: asStr(item?.startDate),
            endDate: asStr(item?.endDate),
            description: asStr(item?.description)
        }))
        : originalCv.education;

    const certificates = Array.isArray(raw?.certificates)
        ? raw.certificates.map((item: any, idx: number) => ({
            id: asStr(item?.id, originalCv.certificates[idx]?.id || String(idx + 1)),
            name: asStr(item?.name),
            organization: asStr(item?.organization),
            date: asStr(item?.date)
        }))
        : originalCv.certificates;

    const languages = Array.isArray(raw?.languages)
        ? raw.languages.map((item: any, idx: number) => ({
            id: asStr(item?.id, originalCv.languages[idx]?.id || String(idx + 1)),
            name: asStr(item?.name),
            level: asStr(item?.level)
        }))
        : originalCv.languages;

    const skills = Array.isArray(raw?.skills)
        ? raw.skills.map((s: unknown) => asStr(s)).filter(Boolean)
        : originalCv.skills;

    const candidate = {
        personal,
        objective: asStr(raw?.objective, originalCv.objective),
        experience,
        education,
        certificates,
        skills,
        languages
    };

    return enrichedCVSchema.parse(candidate);
}

async function postToChatEndpointWithFormatFallback(
    targetUrl: string,
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    timeoutMs: number
) {
    try {
        return await axios.post(targetUrl, payload, { headers, timeout: timeoutMs });
    } catch (err: unknown) {
        if (isAxiosError(err) && err.response?.status === 400 && "response_format" in payload) {
            const { response_format: _ignored, ...payloadWithoutFormat } = payload;
            return await axios.post(targetUrl, payloadWithoutFormat, { headers, timeout: timeoutMs });
        }
        throw err;
    }
}

async function postChatCompletionsWithFallback(
    baseUrl: string,
    apiKey: string,
    payload: Record<string, unknown>,
    timeoutMs = 120000
) {
    const cleanBase = normalizeBaseUrl(baseUrl);
    const headers = buildAuthHeaders(apiKey);
    const primaryUrl = `${cleanBase}/chat/completions`;

    try {
        return await postToChatEndpointWithFormatFallback(primaryUrl, payload, headers, timeoutMs);
    } catch (err: unknown) {
        // Se o usuário informou http://localhost:20128 sem /v1 e recebeu 404, tenta com /v1
        if (isAxiosError(err) && err.response?.status === 404 && !cleanBase.endsWith("/v1")) {
            const fallbackUrl = `${cleanBase}/v1/chat/completions`;
            return await postToChatEndpointWithFormatFallback(fallbackUrl, payload, headers, timeoutMs);
        }
        throw err;
    }
}

export async function enrichCVWithOpenAICompatible(params: {
    rawHtml: string;
    cv: CVData;
    apiKey: string;
    model: string;
    baseUrl: string;
}): Promise<Result<GeminiQuotaExhaustedError | GeminiInvalidResponseError | ConfigurationError, Omit<CVData, "style">>> {
    const { rawHtml, cv, apiKey, model, baseUrl } = params;

    if (!baseUrl || !baseUrl.trim()) {
        return { err: new ConfigurationError("A Base URL do provedor compatível com OpenAI não foi configurada.") };
    }

    if (!model || !model.trim()) {
        return { err: new ConfigurationError("O modelo de IA não foi configurado.") };
    }

    const prompt = ENRICHMENT_GEMINI_PROMPT(cv, rawHtml);

    try {
        const response = await postChatCompletionsWithFallback(baseUrl, apiKey, {
            model: model.trim(),
            messages: [
                {
                    role: "system",
                    content: "Você é um especialista técnico em ATS (Applicant Tracking Systems). Responda EXCLUSIVAMENTE com um objeto JSON válido seguindo o schema solicitado, sem texto adicional e sem blocos markdown."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const rawContent = response.data?.choices?.[0]?.message?.content;

        if (!rawContent || typeof rawContent !== "string") {
            return {
                err: new GeminiInvalidResponseError("O provedor de IA retornou uma resposta vazia ou em formato inesperado.")
            };
        }

        const parsed = extractJsonFromText(rawContent);
        const validatedCV = normalizeEnrichedCV(parsed, cv);

        return { data: validatedCV };
    } catch (error: unknown) {
        return handleOpenAICompatibleError(error);
    }
}

function extractAxiosErrorDetail(error: unknown): string {
    if (isAxiosError(error)) {
        const data = error.response?.data as any;
        const apiMsg =
            data?.error?.message ||
            (typeof data?.error === "string" ? data.error : null) ||
            data?.message ||
            error.message;
        return String(apiMsg || "Erro na comunicação com o provedor de IA.");
    }
    return error instanceof Error ? error.message : "Erro desconhecido no provedor de IA.";
}

export function handleOpenAICompatibleError(
    error: unknown
): { err: GeminiQuotaExhaustedError | GeminiInvalidResponseError | ConfigurationError } {
    if (error instanceof ConfigurationError) {
        return { err: error };
    }

    if (isAxiosError(error)) {
        const status = error.response?.status;
        const detail = extractAxiosErrorDetail(error);

        if (status === 429) {
            return { err: new GeminiQuotaExhaustedError(`Limite de taxa (429) atingido no provedor de IA: ${detail}`) };
        }

        if (status === 401 || status === 403) {
            return { err: new ConfigurationError(`Falha de autenticação (${status}) no provedor de IA: verifique sua API Key. (${detail})`) };
        }

        if (status === 404) {
            return { err: new ConfigurationError(`Endpoint ou modelo não encontrado (404) em ${error.config?.url || "baseUrl"}: ${detail}`) };
        }

        if (!error.response) {
            return { err: new ConfigurationError(`Não foi possível conectar ao endpoint de IA (${error.message}). Verifique se a Base URL está correta e acessível.`) };
        }

        return { err: new GeminiInvalidResponseError(`Erro HTTP ${status} do provedor de IA: ${detail}`) };
    }

    const msg = error instanceof Error ? error.message : "Erro ao processar resposta JSON da IA.";
    return { err: new GeminiInvalidResponseError(msg) };
}

export async function fetchOpenAICompatibleModels(params: {
    apiKey?: string;
    baseUrl: string;
}): Promise<string[]> {
    const cleanBase = normalizeBaseUrl(params.baseUrl);
    if (!cleanBase) {
        throw new ConfigurationError("Informe uma Base URL válida para listar os modelos.");
    }

    const headers = buildAuthHeaders(params.apiKey);
    let response;

    try {
        response = await axios.get(`${cleanBase}/models`, { headers, timeout: 15000 });
    } catch (err: unknown) {
        if (isAxiosError(err) && err.response?.status === 404 && !cleanBase.endsWith("/v1")) {
            response = await axios.get(`${cleanBase}/v1/models`, { headers, timeout: 15000 });
        } else {
            throw new Error(extractAxiosErrorDetail(err));
        }
    }

    const rawList = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.models)
        ? response.data.models
        : Array.isArray(response.data)
        ? response.data
        : [];

    const models: string[] = rawList
        .map((item: any) => (typeof item === "string" ? item : item?.id || item?.name))
        .filter((id: unknown): id is string => typeof id === "string" && id.trim().length > 0);

    return Array.from(new Set(models)).sort((a, b) => a.localeCompare(b));
}

export async function testOpenAICompatibleConnection(params: {
    apiKey: string;
    model: string;
    baseUrl: string;
}): Promise<{ ok: boolean; message: string }> {
    const { apiKey, model, baseUrl } = params;
    const cleanBase = normalizeBaseUrl(baseUrl);

    if (!cleanBase) {
        return { ok: false, message: "A Base URL é obrigatória para este provedor." };
    }

    try {
        await postChatCompletionsWithFallback(
            cleanBase,
            apiKey,
            {
                model: model.trim() || "gpt-4o-mini",
                messages: [{ role: "user", content: "Responda apenas: OK" }],
                max_tokens: 5
            },
            20000
        );

        return {
            ok: true,
            message: `Conexão estabelecida com sucesso usando o modelo "${model}"!`
        };
    } catch (err: unknown) {
        const detail = extractAxiosErrorDetail(err);
        return {
            ok: false,
            message: `Falha ao testar conexão: ${detail}`
        };
    }
}
