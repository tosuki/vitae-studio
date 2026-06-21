import { FastifyRequest, FastifyReply } from "fastify"
import { CoreError } from "../error/error"

const handle = (error: unknown, request: FastifyRequest, reply: FastifyReply) => {
    // 1. Tratamento de CoreError e subclasses
    if (error instanceof CoreError) {
        if (error.isCritical()) {
            request.log.error(error, `Critical CoreError [${error.code}]: ${error.message}`)
        } else {
            request.log.warn(error, `CoreError [${error.code}]: ${error.message}`)
        }

        return reply.status(error.statusCode).send({
            ok: false,
            code: error.code,
            message: error.message,
            raw: error.raw
        })
    }

    // 2. Tratamento de erros de validação do Zod vindos do Fastify Type Provider
    const hasValidationError = error && typeof error === "object" && ("validation" in error || "issues" in error)
    if (hasValidationError) {
        const issues = (error as any).validation || (error as any).issues
        request.log.warn(error, "Schema validation failed")
        
        return reply.status(400).send({
            ok: false,
            code: "VALIDATION_FAILED",
            message: (error as any).message || "Validation failed",
            raw: issues
        })
    }

    // 3. Fallback para erros genéricos ou não tratados
    request.log.error(error, "Unhandled internal error occurred")
    return reply.status(500).send({
        ok: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "internal-server-error"
    })
}

export default { handle }