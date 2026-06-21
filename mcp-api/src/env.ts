import { z } from "zod"

const envSchema = z.object({
    SERVER_PORT: z.number().optional().default(3000),
    SERVER_HOST: z.string().optional().default("0.0.0.0"),

    REDIS_HOST: z.string().optional().default("0.0.0.0"),
    REDIS_PORT: z.number().optional().default(6379),

    GEMINI_QUEUE_NAME: z.string().optional().default("GEMINI_QUEUE"),
    PUPPETEER_QUEUE_NAME: z.string().optional().default("PUPPETEER")
})

export const env = envSchema.parse(process.env)
