import { FastifyPluginAsync } from "fastify"

const route: FastifyPluginAsync = async (fastify, opts) => {
    fastify.get("/", (_, reply) => reply.status(200).send({
        ok: true,
        message: "pong!"
    }))
}

export default { route }