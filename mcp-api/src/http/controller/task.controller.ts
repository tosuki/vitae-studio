import { FastifyRequest, FastifyReply } from "fastify"
import { QueueManager } from "../../queue/queue"

import { CreateTaskBody, GetTaskResultQuery } from "../schema/task.schema"

export class TaskController {
    constructor(
        private queue: QueueManager
    ) {}

    async createTask(request: FastifyRequest, reply: FastifyReply) {
        const body = request.body as CreateTaskBody

        const createdTask = await this.queue.createTask({
            state: "IDLE",
            type: "details",
            url: body.url
        })

        return reply.status(201).send({
            ok: true,
            data: createdTask
        })
    }

    async getTaskResult(request: FastifyRequest, reply: FastifyReply) {
        const queries = request.query as GetTaskResultQuery
        const result = await this.queue.getTask(queries)

        return reply.status(200).send({
            ok: true,
            data: result
        })
    }
}
