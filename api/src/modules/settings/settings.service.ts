import fs from "node:fs/promises";
import path from "node:path";
import Redis from "ioredis";
import { GoogleGenAI } from "@google/genai";
import env from "../../env";
import { logger } from "../../util/logger";
import {
    AIProviderType,
    AppSettings,
    DEFAULT_PROVIDER_BASE_URLS,
    DEFAULT_PROVIDER_MODELS,
    ListModelsDTO,
    ListModelsResponseDTO,
    PublicSettingsDTO,
    TestConnectionDTO,
    TestConnectionResponseDTO,
    UpdateSettingsDTO
} from "./settings.model";
import {
    fetchOpenAICompatibleModels,
    normalizeBaseUrl,
    testOpenAICompatibleConnection
} from "../enrichment/ai/openai-compatible.provider";

const REDIS_SETTINGS_KEY = "settings:app";

export function extractGeminiErrorMessage(err: any): string {
    const raw = String(err?.message || "");
    try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed?.error?.message) {
                return String(parsed.error.message);
            }
        }
    } catch {
        // ignore JSON parse error
    }
    return raw || "Erro desconhecido na comunicação com a API do Gemini.";
}

export async function fetchGeminiModels(apiKey: string): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 15000 } });
    const models: string[] = [];

    try {
        const pager = await ai.models.list({ config: { pageSize: 100 } });
        for await (const model of pager) {
            const supportsText = model.supportedActions?.includes("generateContent") ?? true;
            const name = model.name?.replace(/^models\//, "");
            if (name && supportsText) {
                const lower = name.toLowerCase();
                const isExcluded =
                    lower.includes("-tts") ||
                    lower.includes("-image") ||
                    lower.includes("-transcribe") ||
                    lower.includes("robotics") ||
                    lower.includes("computer-use") ||
                    lower.includes("embedding");

                if (!isExcluded) {
                    models.push(name);
                }
            }
        }
    } catch (err: any) {
        throw new Error(`Falha ao listar modelos do Gemini: ${extractGeminiErrorMessage(err)}`);
    }

    return sortModelsNewestFirst(Array.from(new Set(models)));
}

const extractModelVersion = (name: string): number => {
    const match = name.match(/^gemini-(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : -1;
};

export function sortModelsNewestFirst(models: string[]): string[] {
    return models.sort((a, b) => {
        const versionDiff = extractModelVersion(b) - extractModelVersion(a);
        if (versionDiff !== 0) return versionDiff;

        const previewDiff = Number(a.includes("preview")) - Number(b.includes("preview"));
        if (previewDiff !== 0) return previewDiff;

        return a.localeCompare(b);
    });
}

export class SettingsService {
    private readonly settingsFilePath: string;
    private memoryCache: AppSettings | null = null;

    constructor(private readonly redis: Redis) {
        this.settingsFilePath = path.resolve(env.RESOURCES_DIR, "settings.json");
    }

    public async getSettings(): Promise<AppSettings | null> {
        if (this.redis.status === "ready") {
            try {
                const cachedRaw = await this.redis.get(REDIS_SETTINGS_KEY);
                if (cachedRaw) {
                    const parsed = JSON.parse(cachedRaw) as AppSettings;
                    this.memoryCache = parsed;
                    return parsed;
                }
            } catch (err) {
                logger.warn(err, "Não foi possível ler configurações do Redis; utilizando arquivo local.");
            }
        }

        const fileSettings = await this.readFromFile();
        if (fileSettings) {
            this.memoryCache = fileSettings;
            await this.saveToRedis(fileSettings);
            return fileSettings;
        }

        if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
            const fallbackSettings: AppSettings = {
                provider: "gemini",
                apiKey: env.GEMINI_API_KEY.trim(),
                model: DEFAULT_PROVIDER_MODELS.gemini,
                baseUrl: "",
                updatedAt: Date.now()
            };
            await this.persistSettings(fallbackSettings);
            return fallbackSettings;
        }

        this.memoryCache = null;
        return null;
    }

    public async getPublicSettings(): Promise<PublicSettingsDTO> {
        const settings = await this.getSettings();
        return this.toPublicDTO(settings);
    }

    public async updateSettings(dto: UpdateSettingsDTO): Promise<PublicSettingsDTO> {
        const existing = await this.getSettings();
        const isSameProvider = existing?.provider === dto.provider;

        const incomingKey = dto.apiKey?.trim();
        const resolvedApiKey =
            incomingKey && incomingKey.length > 0
                ? incomingKey
                : isSameProvider
                ? existing?.apiKey || ""
                : "";

        const resolvedModel =
            dto.model?.trim() ||
            (isSameProvider ? existing?.model : undefined) ||
            DEFAULT_PROVIDER_MODELS[dto.provider];

        let resolvedBaseUrl = "";
        if (dto.provider === "openai") {
            resolvedBaseUrl = dto.baseUrl?.trim()
                ? normalizeBaseUrl(dto.baseUrl)
                : DEFAULT_PROVIDER_BASE_URLS.openai;
        } else if (dto.provider === "openai-compatible") {
            resolvedBaseUrl = dto.baseUrl?.trim()
                ? normalizeBaseUrl(dto.baseUrl)
                : (isSameProvider ? existing?.baseUrl : undefined) ||
                  DEFAULT_PROVIDER_BASE_URLS["openai-compatible"];
        }

        const updated: AppSettings = {
            provider: dto.provider,
            apiKey: resolvedApiKey,
            model: resolvedModel,
            baseUrl: resolvedBaseUrl,
            updatedAt: Date.now()
        };

        await this.persistSettings(updated);
        return this.toPublicDTO(updated);
    }

    public async testConnection(dto: TestConnectionDTO): Promise<TestConnectionResponseDTO> {
        const existing = await this.getSettings();
        const provider: AIProviderType = dto.provider;
        const isSameProvider = existing?.provider === provider;

        const apiKey =
            dto.apiKey && dto.apiKey.trim().length > 0
                ? dto.apiKey.trim()
                : isSameProvider
                ? existing?.apiKey || ""
                : "";

        const model =
            dto.model && dto.model.trim().length > 0
                ? dto.model.trim()
                : (isSameProvider ? existing?.model : undefined) || DEFAULT_PROVIDER_MODELS[provider];

        const baseUrl =
            provider === "openai"
                ? dto.baseUrl?.trim() || DEFAULT_PROVIDER_BASE_URLS.openai
                : provider === "openai-compatible"
                ? dto.baseUrl?.trim() ||
                  (isSameProvider ? existing?.baseUrl : undefined) ||
                  DEFAULT_PROVIDER_BASE_URLS["openai-compatible"]
                : "";

        if (!apiKey) {
            return {
                ok: false,
                message: "Informe uma API Key válida antes de testar a conexão.",
                provider,
                model
            };
        }

        if (provider === "gemini") {
            try {
                const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 12000 } });
                await ai.models.generateContent({
                    model,
                    contents: "Responda apenas: OK"
                });

                return {
                    ok: true,
                    message: `Conexão com Google Gemini (${model}) estabelecida com sucesso!`,
                    provider,
                    model
                };
            } catch (err: any) {
                const rawMsg = String(err?.message || "");
                let cleanMsg = extractGeminiErrorMessage(err);

                if (
                    rawMsg.includes("504") ||
                    rawMsg.includes("DEADLINE_EXCEEDED") ||
                    rawMsg.includes("aborted") ||
                    rawMsg.includes("timeout")
                ) {
                    cleanMsg = `O modelo "${model}" demorou mais de 12 segundos para responder na API do Google (timeout ou alta sobrecarga). Experimente um modelo mais ágil como gemini-3.5-flash-lite ou gemini-2.5-flash.`;
                } else if (rawMsg.includes("503") || rawMsg.includes("high demand")) {
                    cleanMsg = `O modelo "${model}" está com alta demanda nos servidores da Google. Tente novamente em instantes ou utilize gemini-3.5-flash-lite.`;
                }

                return {
                    ok: false,
                    message: `Falha na conexão com Gemini: ${cleanMsg}`,
                    provider,
                    model
                };
            }
        }

        const result = await testOpenAICompatibleConnection({
            apiKey,
            model,
            baseUrl
        });

        return {
            ok: result.ok,
            message: result.message,
            provider,
            model
        };
    }

    public async listModels(dto: ListModelsDTO): Promise<ListModelsResponseDTO> {
        const existing = await this.getSettings();
        const provider = dto.provider;
        const isSameProvider = existing?.provider === provider;

        const apiKey =
            dto.apiKey && dto.apiKey.trim().length > 0
                ? dto.apiKey.trim()
                : isSameProvider
                ? existing?.apiKey || ""
                : "";

        if (provider === "gemini") {
            if (!apiKey) {
                throw new Error("Informe uma API Key do Gemini para listar os modelos disponíveis.");
            }
            return { models: await fetchGeminiModels(apiKey) };
        }

        const baseUrl =
            provider === "openai"
                ? dto.baseUrl?.trim() || DEFAULT_PROVIDER_BASE_URLS.openai
                : dto.baseUrl?.trim() ||
                  (isSameProvider ? existing?.baseUrl : undefined) ||
                  DEFAULT_PROVIDER_BASE_URLS["openai-compatible"];

        const models = await fetchOpenAICompatibleModels({ apiKey, baseUrl });
        return { models };
    }

    public async clearSettings(): Promise<void> {
        this.memoryCache = null;
        try {
            await fs.unlink(this.settingsFilePath);
        } catch {
            // ignore if file does not exist
        }
        if (this.redis.status === "ready") {
            try {
                await this.redis.del(REDIS_SETTINGS_KEY);
            } catch (err) {
                logger.warn(err, "Não foi possível remover configurações do Redis.");
            }
        }
    }

    public isSettingsConfigured(settings: AppSettings | null): boolean {
        if (!settings) return false;
        const hasKey = Boolean(settings.apiKey && settings.apiKey.trim().length > 0);
        const hasModel = Boolean(settings.model && settings.model.trim().length > 0);

        if (settings.provider === "openai-compatible") {
            const hasBaseUrl = Boolean(settings.baseUrl && settings.baseUrl.trim().length > 0);
            return hasKey && hasModel && hasBaseUrl;
        }

        return hasKey && hasModel;
    }

    private toPublicDTO(settings: AppSettings | null): PublicSettingsDTO {
        if (!settings) {
            return {
                isConfigured: false,
                provider: "gemini",
                model: DEFAULT_PROVIDER_MODELS.gemini,
                baseUrl: DEFAULT_PROVIDER_BASE_URLS["openai-compatible"],
                hasApiKey: false,
                apiKeyPreview: null,
                updatedAt: null
            };
        }

        const hasApiKey = Boolean(settings.apiKey && settings.apiKey.trim().length > 0);

        return {
            isConfigured: this.isSettingsConfigured(settings),
            provider: settings.provider,
            model: settings.model || DEFAULT_PROVIDER_MODELS[settings.provider],
            baseUrl:
                settings.baseUrl ||
                (settings.provider === "openai"
                    ? DEFAULT_PROVIDER_BASE_URLS.openai
                    : DEFAULT_PROVIDER_BASE_URLS["openai-compatible"]),
            hasApiKey,
            apiKeyPreview: hasApiKey ? this.maskApiKey(settings.apiKey) : null,
            updatedAt: settings.updatedAt
        };
    }

    private maskApiKey(apiKey: string): string {
        const trimmed = apiKey.trim();
        if (trimmed.length <= 8) {
            return "••••••••";
        }
        const prefix = trimmed.slice(0, 4);
        const suffix = trimmed.slice(-4);
        return `${prefix}...${suffix}`;
    }

    private async persistSettings(settings: AppSettings): Promise<void> {
        this.memoryCache = settings;
        await this.saveToFile(settings);
        await this.saveToRedis(settings);
    }

    private async saveToRedis(settings: AppSettings): Promise<void> {
        if (this.redis.status !== "ready") {
            return;
        }
        try {
            await this.redis.set(REDIS_SETTINGS_KEY, JSON.stringify(settings));
        } catch (err) {
            logger.warn(err, "Não foi possível salvar configurações no Redis.");
        }
    }

    private async readFromFile(): Promise<AppSettings | null> {
        try {
            const raw = await fs.readFile(this.settingsFilePath, "utf-8");
            const parsed = JSON.parse(raw) as AppSettings;
            if (parsed && parsed.provider) {
                return parsed;
            }
            return null;
        } catch {
            return null;
        }
    }

    private async saveToFile(settings: AppSettings): Promise<void> {
        try {
            const dir = path.dirname(this.settingsFilePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(this.settingsFilePath, JSON.stringify(settings, null, 2), "utf-8");
        } catch (err) {
            logger.error(err, `Falha ao persistir configurações em ${this.settingsFilePath}`);
        }
    }
}
