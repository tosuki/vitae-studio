import { FastifyPluginAsync } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"

import {
    createTaskSchema,
    getTaskResultSchema
} from "./schema/task.schema"
import { getTaskHttpControllerInstance } from "../factory"

const route: FastifyPluginAsync = async (fastify, opts) => {
    const taskHttpController = getTaskHttpControllerInstance()

    fastify.get("/", (_, reply) => reply.status(200).send({
        ok: true,
        message: "pong!"
    }))

    fastify.withTypeProvider<ZodTypeProvider>().post("/", {
        schema: createTaskSchema
    }, taskHttpController.createTask.bind(taskHttpController))

    fastify.withTypeProvider<ZodTypeProvider>().get("/claim", {
        schema: getTaskResultSchema
    }, taskHttpController.getTaskResult.bind(taskHttpController))
}

export default { route }