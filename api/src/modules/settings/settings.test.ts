import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";
import router from "../http/router";
import env from "../../env";
import { getRedisClient, getSettingsService, shutdownAll } from "../enrichment/factory";
import { enrichCVWithAI } from "../enrichment/gemini/gemini";
import {
    enrichCVWithOpenAICompatible,
    extractJsonFromText,
    normalizeBaseUrl
} from "../enrichment/ai/openai-compatible.provider";
import { CVData } from "../common/model/cv.model";

const sampleCV: CVData = {
    personal: {
        fullName: "Maria Dev",
        title: "Engenheira de Software",
        email: "maria@example.com",
        phone: "11999999999",
        location: "São Paulo, SP",
        linkedin: "linkedin.com/in/mariadev",
        github: "github.com/mariadev"
    },
    objective: "Atuar como Engenheira Backend",
    experience: [
        {
            id: "exp-1",
            company: "Tech Corp",
            role: "Backend Developer",
            location: "Remoto",
            startDate: "01/2023",
            endDate: "",
            description: "Desenvolvimento de APIs Node.js"
        }
    ],
    education: [
        {
            id: "edu-1",
            institution: "USP",
            degree: "Ciência da Computação",
            startDate: "02/2018",
            endDate: "12/2022",
            description: "Bacharelado"
        }
    ],
    certificates: [
        {
            id: "cert-1",
            name: "AWS Certified",
            organization: "Amazon",
            date: "05/2024"
        }
    ],
    skills: ["TypeScript", "Node.js"],
    languages: [
        {
            id: "lang-1",
            name: "Inglês",
            level: "Avançado"
        }
    ],
    style: {
        theme: "modern",
        fontFamily: "Inter",
        accentColor: "#2563eb",
        spacing: "normal"
    }
};

describe("Settings & Multi-Provider AI (Gemini, OpenAI, OpenAPI / 9router)", () => {
    const settingsFilePath = path.resolve(env.RESOURCES_DIR, "settings.json");
    const originalEnvGeminiKey = env.GEMINI_API_KEY;
    let backupFileSettings: string | null = null;
    let backupRedisSettings: string | null = null;
    let mockGatewayServer: http.Server | null = null;
    let mockGatewayPort = 0;
    let lastModelsAuthHeader: string | undefined = undefined;

    beforeAll(async () => {
        try {
            backupFileSettings = await fs.readFile(settingsFilePath, "utf-8");
        } catch {
            backupFileSettings = null;
        }

        const redis = getRedisClient();
        // Wait briefly for Redis connection if available locally
        if (redis.status !== "ready") {
            await new Promise<void>((resolve) => {
                const timer = setTimeout(resolve, 300);
                redis.once("ready", () => {
                    clearTimeout(timer);
                    resolve();
                });
                redis.once("error", () => {
                    clearTimeout(timer);
                    resolve();
                });
            });
        }

        if (redis.status === "ready") {
            try {
                backupRedisSettings = await redis.get("settings:app");
            } catch {
                backupRedisSettings = null;
            }
        }
    });

    beforeEach(async () => {
        env.GEMINI_API_KEY = "";
        lastModelsAuthHeader = undefined;
        await getSettingsService().clearSettings();

        mockGatewayServer = http.createServer((req, res) => {
            if (req.url === "/v1/models" && req.method === "GET") {
                lastModelsAuthHeader = req.headers["authorization"];
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                    JSON.stringify({
                        object: "list",
                        data: [
                            { id: "9router-claude-3-7-sonnet" },
                            { id: "9router-gpt-4o-mini" },
                            { id: "gemini-2.5-flash" }
                        ]
                    })
                );
                return;
            }

            if (req.url === "/v1/chat/completions" && req.method === "POST") {
                const auth = req.headers["authorization"];
                if (auth === "Bearer invalid-key") {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: { message: "Invalid API key provided" } }));
                    return;
                }

                if (auth === "Bearer rate-limited-key") {
                    res.writeHead(429, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: { message: "Rate limit exceeded" } }));
                    return;
                }

                let body = "";
                req.on("data", (chunk) => {
                    body += chunk;
                });
                req.on("end", () => {
                    const parsed = JSON.parse(body || "{}");

                    // Simulate gateway model that rejects response_format: { type: "json_object" }
                    if (parsed?.model === "strict-no-response-format" && parsed?.response_format) {
                        res.writeHead(400, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: { message: "response_format is not supported by this model" } }));
                        return;
                    }

                    const isPing = parsed?.max_tokens === 5;
                    if (isPing) {
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(
                            JSON.stringify({
                                choices: [{ message: { content: "OK" } }]
                            })
                        );
                        return;
                    }

                    const enrichedPayload = {
                        personal: sampleCV.personal,
                        objective: "Engenheira de Software Sênior focada em Node.js, Fastify e Arquitetura Distribuída",
                        experience: [
                            {
                                ...sampleCV.experience[0],
                                description: "Arquitetura de microsserviços escaláveis com Node.js, TypeScript e Redis."
                            }
                        ],
                        education: sampleCV.education,
                        certificates: sampleCV.certificates,
                        skills: ["TypeScript", "Node.js", "Fastify", "Redis"],
                        languages: sampleCV.languages
                    };

                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            choices: [
                                {
                                    message: {
                                        content: "```json\n" + JSON.stringify(enrichedPayload, null, 2) + "\n```"
                                    }
                                }
                            ]
                        })
                    );
                });
                return;
            }

            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Not found" }));
        });

        await new Promise<void>((resolve) => {
            mockGatewayServer!.listen(0, "127.0.0.1", () => {
                const addr = mockGatewayServer!.address();
                if (addr && typeof addr === "object") {
                    mockGatewayPort = addr.port;
                }
                resolve();
            });
        });
    });

    afterEach(async () => {
        if (mockGatewayServer) {
            await new Promise<void>((resolve) => mockGatewayServer!.close(() => resolve()));
            mockGatewayServer = null;
        }
        env.GEMINI_API_KEY = originalEnvGeminiKey;
        await getSettingsService().clearSettings();
    });

    afterAll(async () => {
        const redis = getRedisClient();
        if (backupFileSettings !== null) {
            await fs.mkdir(path.dirname(settingsFilePath), { recursive: true });
            await fs.writeFile(settingsFilePath, backupFileSettings, "utf-8");
        } else {
            try {
                await fs.unlink(settingsFilePath);
            } catch {
                // ignore
            }
        }

        if (redis.status === "ready") {
            if (backupRedisSettings !== null) {
                await redis.set("settings:app", backupRedisSettings);
            } else {
                await redis.del("settings:app");
            }
        }

        await shutdownAll();
    });

    it("normalizes baseUrls and extracts JSON from markdown code fences and reasoning <think> blocks", () => {
        expect(normalizeBaseUrl("http://localhost:20128/v1/")).toBe("http://localhost:20128/v1");
        expect(normalizeBaseUrl("http://localhost:20128/v1/chat/completions/")).toBe("http://localhost:20128/v1");

        const rawFence = "Aqui está o JSON:\n```json\n{\"hello\": \"world\"}\n```";
        expect(extractJsonFromText(rawFence)).toEqual({ hello: "world" });

        const rawThink = "<think>\nO usuário espera algo como {\"exemplo\": 123}.\n</think>\n{\"hello\": \"reasoning\"}";
        expect(extractJsonFromText(rawThink)).toEqual({ hello: "reasoning" });
    });

    it("handles HTTP /settings onboarding lifecycle (GET/PUT), key preservation, cross-provider isolation, CORS preflight, and 9router model discovery", async () => {
        const app = Fastify();
        app.setValidatorCompiler(validatorCompiler);
        app.setSerializerCompiler(serializerCompiler);
        await app.register(cors, {
            origin: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        });
        await app.register(router);

        // 0. GET /settings on first access returns isConfigured: false
        const initialGet = await app.inject({
            method: "GET",
            url: "/settings"
        });
        expect(initialGet.statusCode).toBe(200);
        expect(initialGet.json().isConfigured).toBe(false);
        expect(initialGet.json().hasApiKey).toBe(false);
        expect(initialGet.json().apiKeyPreview).toBeNull();

        // 1. CORS preflight for PUT /settings
        const preflight = await app.inject({
            method: "OPTIONS",
            url: "/settings",
            headers: {
                Origin: "http://localhost:5173",
                "Access-Control-Request-Method": "PUT"
            }
        });
        expect(preflight.statusCode).toBe(204);
        expect(preflight.headers["access-control-allow-methods"]).toContain("PUT");

        // 2. Rejects saving when no key is provided on first setup
        const badSave = await app.inject({
            method: "PUT",
            url: "/settings",
            payload: {
                provider: "openai-compatible",
                apiKey: "",
                model: "9router-gpt-4o-mini",
                baseUrl: `http://127.0.0.1:${mockGatewayPort}/v1`
            }
        });
        expect(badSave.statusCode).toBe(400);

        // 3. Saves 9router / openai-compatible configuration and masks API key
        const validSave = await app.inject({
            method: "PUT",
            url: "/settings",
            payload: {
                provider: "openai-compatible",
                apiKey: "sk-9router-secret-9f2a",
                model: "9router-gpt-4o-mini",
                baseUrl: `http://127.0.0.1:${mockGatewayPort}/v1`
            }
        });
        expect(validSave.statusCode).toBe(200);
        const savedBody = validSave.json();
        expect(savedBody.isConfigured).toBe(true);
        expect(savedBody.provider).toBe("openai-compatible");
        expect(savedBody.hasApiKey).toBe(true);
        expect(savedBody.apiKeyPreview).toBe("sk-9...9f2a");

        // Verify GET /settings reflects persisted state, file persistence, and Redis cache sync
        const afterSaveGet = await app.inject({
            method: "GET",
            url: "/settings"
        });
        expect(afterSaveGet.statusCode).toBe(200);
        expect(afterSaveGet.json().isConfigured).toBe(true);
        expect(afterSaveGet.json().apiKeyPreview).toBe("sk-9...9f2a");

        const persistedFileRaw = await fs.readFile(settingsFilePath, "utf-8");
        expect(JSON.parse(persistedFileRaw).provider).toBe("openai-compatible");

        const redis = getRedisClient();
        if (redis.status === "ready") {
            const cachedRedisRaw = await redis.get("settings:app");
            expect(cachedRedisRaw).not.toBeNull();
            expect(JSON.parse(cachedRedisRaw!).apiKey).toBe("sk-9router-secret-9f2a");
        }

        // 4. Updating model without sending apiKey preserves existing key for SAME provider
        const updateModelOnly = await app.inject({
            method: "PUT",
            url: "/settings",
            payload: {
                provider: "openai-compatible",
                model: "9router-claude-3-7-sonnet",
                baseUrl: `http://127.0.0.1:${mockGatewayPort}/v1`
            }
        });
        expect(updateModelOnly.statusCode).toBe(200);
        expect(updateModelOnly.json().model).toBe("9router-claude-3-7-sonnet");
        expect(updateModelOnly.json().apiKeyPreview).toBe("sk-9...9f2a");

        // 5. Cross-provider isolation: testing connection or listing models for a DIFFERENT provider without apiKey does NOT leak saved key
        const crossProviderTest = await app.inject({
            method: "POST",
            url: "/settings/test",
            payload: {
                provider: "gemini"
            }
        });
        expect(crossProviderTest.statusCode).toBe(200);
        expect(crossProviderTest.json().ok).toBe(false);
        expect(crossProviderTest.json().message).toContain("API Key");

        // 6. Lists models from 9router gateway (even when baseUrl omits /v1!)
        const modelsRes = await app.inject({
            method: "POST",
            url: "/settings/models",
            payload: {
                provider: "openai-compatible",
                baseUrl: `http://127.0.0.1:${mockGatewayPort}`
            }
        });
        expect(modelsRes.statusCode).toBe(200);
        expect(modelsRes.json().models).toEqual([
            "9router-claude-3-7-sonnet",
            "9router-gpt-4o-mini",
            "gemini-2.5-flash"
        ]);
        expect(lastModelsAuthHeader).toBe("Bearer sk-9router-secret-9f2a");

        // 7. Tests connection against 9router gateway
        const testOk = await app.inject({
            method: "POST",
            url: "/settings/test",
            payload: {
                provider: "openai-compatible",
                baseUrl: `http://127.0.0.1:${mockGatewayPort}/v1`,
                model: "9router-claude-3-7-sonnet"
            }
        });
        expect(testOk.statusCode).toBe(200);
        expect(testOk.json().ok).toBe(true);

        // 8. Tests connection with invalid key
        const testFail = await app.inject({
            method: "POST",
            url: "/settings/test",
            payload: {
                provider: "openai-compatible",
                apiKey: "invalid-key",
                baseUrl: `http://127.0.0.1:${mockGatewayPort}/v1`,
                model: "9router-claude-3-7-sonnet"
            }
        });
        expect(testFail.statusCode).toBe(200);
        expect(testFail.json().ok).toBe(false);

        await app.close();
    });

    it("enriches CV using OpenAICompatibleProvider (9router) even when both /v1 is omitted and response_format is rejected", async () => {
        const result = await enrichCVWithOpenAICompatible({
            rawHtml: "<html><body>Vaga Engenheira Node.js Sênior com Fastify e Redis</body></html>",
            cv: sampleCV,
            apiKey: "sk-9router-secret-9f2a",
            model: "strict-no-response-format",
            baseUrl: `http://127.0.0.1:${mockGatewayPort}`
        });

        expect(result.err).toBeUndefined();
        expect(result.data).toBeDefined();
        expect(result.data?.experience[0].id).toBe("exp-1");
        expect(result.data?.skills).toContain("Fastify");
    });

    it("handles edge cases: missing baseUrl for openai-compatible, 401 ConfigurationError, 429 rate-limit mapping, and unconfigured enrichCVWithAI", async () => {
        const app = Fastify();
        app.setValidatorCompiler(validatorCompiler);
        app.setSerializerCompiler(serializerCompiler);
        await app.register(router);

        // 1. Missing baseUrl for openai-compatible returns 400
        const missingBaseUrl = await app.inject({
            method: "PUT",
            url: "/settings",
            payload: {
                provider: "openai-compatible",
                apiKey: "sk-test-12345678",
                model: "gpt-4o-mini",
                baseUrl: "   "
            }
        });
        expect(missingBaseUrl.statusCode).toBe(400);

        await app.close();

        // 2. Unconfigured enrichCVWithAI returns ConfigurationError
        const unconfiguredResult = await enrichCVWithAI("<html></html>", sampleCV);
        expect(unconfiguredResult.err).toBeDefined();
        expect(unconfiguredResult.err?.name).toBe("ConfigurationError");

        // 3. 401 maps to ConfigurationError
        const authFailure = await enrichCVWithOpenAICompatible({
            rawHtml: "<html></html>",
            cv: sampleCV,
            apiKey: "invalid-key",
            model: "9router-gpt-4o-mini",
            baseUrl: `http://127.0.0.1:${mockGatewayPort}/v1`
        });
        expect(authFailure.err).toBeDefined();
        expect(authFailure.err?.name).toBe("ConfigurationError");

        // 4. 429 maps to GeminiQuotaExhaustedError (recoverable by BullMQ)
        const rateLimitFailure = await enrichCVWithOpenAICompatible({
            rawHtml: "<html></html>",
            cv: sampleCV,
            apiKey: "rate-limited-key",
            model: "9router-gpt-4o-mini",
            baseUrl: `http://127.0.0.1:${mockGatewayPort}/v1`
        });
        expect(rateLimitFailure.err).toBeDefined();
        expect(rateLimitFailure.err?.name).toBe("GeminiQuotaExhaustedError");
    });
});
