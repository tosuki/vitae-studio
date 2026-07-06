import { FastifySchema } from "fastify"
import { z } from "zod"

export const createTaskSchema: FastifySchema = {
    body: z.object({
        linkedinJobId: z.string().min(1, "linkedinJobId é obrigatório")
    }),
    response: {
        201: z.object({
            id: z.string(),
            status: z.string(),
            linkedinJobId: z.string(),
            extractedJson: z.any().nullable(),
            errorMessage: z.string().nullable(),
            updatedAt: z.number()
        })
    }
}

export const getTaskSchema: FastifySchema = {
    params: z.object({
        id: z.string().uuid("ID precisa ser um UUID válido")
    }),
    response: {
        200: z.object({
            id: z.string(),
            status: z.string(),
            linkedinJobId: z.string(),
            extractedJson: z.any().nullable(),
            errorMessage: z.string().nullable(),
            updatedAt: z.number()
        }),
        404: z.object({
            error: z.string()
        })
    }
}
