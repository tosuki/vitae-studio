import { FastifySchema } from "fastify";
import { z } from "zod";

export const aiProviderSchema = z.enum(["gemini", "openai", "openai-compatible"]);

export const publicSettingsResponseSchema = z.object({
    isConfigured: z.boolean(),
    provider: aiProviderSchema,
    model: z.string(),
    baseUrl: z.string(),
    hasApiKey: z.boolean(),
    apiKeyPreview: z.string().nullable(),
    updatedAt: z.number().nullable()
});

export const getSettingsSchema: FastifySchema = {
    response: {
        200: publicSettingsResponseSchema
    }
};

export const updateSettingsSchema: FastifySchema = {
    body: z.object({
        provider: aiProviderSchema,
        apiKey: z.string().optional(),
        model: z.string().min(1, "O modelo é obrigatório."),
        baseUrl: z.string().optional()
    }),
    response: {
        200: publicSettingsResponseSchema,
        400: z.object({
            error: z.string()
        })
    }
};

export const testSettingsConnectionSchema: FastifySchema = {
    body: z.object({
        provider: aiProviderSchema,
        apiKey: z.string().optional(),
        model: z.string().optional(),
        baseUrl: z.string().optional()
    }),
    response: {
        200: z.object({
            ok: z.boolean(),
            message: z.string(),
            provider: aiProviderSchema,
            model: z.string()
        })
    }
};

export const listSettingsModelsSchema: FastifySchema = {
    body: z.object({
        provider: aiProviderSchema,
        apiKey: z.string().optional(),
        baseUrl: z.string().optional()
    }),
    response: {
        200: z.object({
            models: z.array(z.string())
        }),
        400: z.object({
            error: z.string()
        })
    }
};
