import { FastifyPluginAsync } from "fastify"

const router: FastifyPluginAsync = async (instance, opts) => {
    instance.get("/", (_, reply) => reply.status(200).send({ ok: true }))
}

export default router