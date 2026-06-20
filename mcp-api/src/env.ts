import { z } from "zod"

const envSchema = z.object({
    SERVER_PORT: z.number().optional().default(3000),
    SERVER_HOST: z.string().optional().default("0.0.0.0")
})

export const env = envSchema.parse(process.env)
