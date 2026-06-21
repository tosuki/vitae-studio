import { z } from "zod"

const envSchema = z.object({
    SERVER_PORT: z.string().default("3000"),
    SERVER_HOST: z.string().optional().default("0.0.0.0"),

    REDIS_HOST: z.string().optional().default("0.0.0.0"),
    REDIS_PORT: z.string().default("6379"),

    GEMINI_QUEUE_NAME: z.string().optional().default("GEMINI_QUEUE"),
    JOB_VACANCY_DETAILS_QUEUE: z.string().optional().default("JOB_VACANCY_DETAILS_QUEUE")
})

export const env = envSchema.parse(process.env)
