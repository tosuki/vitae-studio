import "dotenv/config"

import { z, ZodError } from "zod"
import logger from "./logger"

process.on("uncaughtException", (error) => {
    if (error instanceof ZodError) {
        logger.error(z.prettifyError(error))
        process.exit(1)
    }

    throw error
})

const envSchema = z.object({
    API_PORT: z.string().optional().default("3000").superRefine((validate, ctx) => {
        const parsed = Number(validate)

        if (isNaN(parsed)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The API_PORT variable must be a number"
            })

            return z.NEVER
        }
    }).transform((value) => Number(value)),

    API_HOST: z.string().optional().default("127.0.0.1"),
    REDIS_HOST: z.string().optional().default("127.0.0.1"),
    REDIS_PORT: z.string().optional().default("6379").superRefine((val, ctx) => {
        const parsed = Number(val)

        if (isNaN(parsed)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The REDIS_PORT variable must be a number"
            })

            return z.NEVER
        }
    }).transform((val) => Number(val))
})

const env = envSchema.parse(process.env)

export default env