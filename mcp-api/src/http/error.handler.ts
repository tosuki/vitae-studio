import { FastifyRequest, FastifyReply } from "fastify"

const handle = (error: unknown, request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(500).send({
        ok: false,
        message: "internal-server-error"
    })
}

export default { handle }