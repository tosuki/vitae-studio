import { FastifyReply, FastifyRequest } from "fastify";
import { getTaskService } from "../../enrichment/factory";
import { CreateTaskDTO } from "../../enrichment/dtos/create-task.dto";

export class TaskController {
    public async create(
        request: FastifyRequest<{ Body: CreateTaskDTO }>,
        reply: FastifyReply
    ) {
        const taskService = getTaskService();
        const task = await taskService.createTask(request.body);

        return reply.status(201).send(task);
    }

    public async get(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const { id } = request.params;
        const taskService = getTaskService();
        const task = await taskService.getTask(id);

        if (!task) {
            return reply.status(404).send({
                error: "Task não encontrada."
            });
        }

        return reply.status(200).send(task);
    }
}
