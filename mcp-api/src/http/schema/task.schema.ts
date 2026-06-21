import { FastifySchema } from "fastify"
import { z } from "zod"

export type CreateTaskBody = {
    url: string
}

export const createTaskSchema: FastifySchema = {
    body: z.object({
        url: z.url()
    })
}

export type GetTaskResultQuery = {
    offset: number
    limit: number
    type: "all" | "details" | "gemini",
    id: string
}

export const getTaskResultSchema: FastifySchema = {
    querystring: z.object({
        offset: z.number().optional().default(0),
        limit: z.number().optional().default(10),
        type: z.enum(["all", "details", "gemini"]).default("all"),
        id: z.string().optional()
    })
}
