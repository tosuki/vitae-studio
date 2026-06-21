import { FastifyRequest, FastifyReply } from "fastify"
import { QueueManager } from "../../queue/queue"
import { CreateTaskBody, GetTaskResultQuery } from "../schema/task.schema"

/**
 * Controlador responsável por lidar com requisições HTTP de criação e busca de Tarefas (Tasks).
 * Conecta o protocolo HTTP ao enfileiramento de jobs no BullMQ por meio do `QueueManager`.
 * 
 * @example
 * ```typescript
 * const taskController = new TaskController(queueManager);
 * ```
 */
export class TaskController {
    /**
     * Cria um TaskController.
     * @param queue Instância do QueueManager injetada para agendamento de jobs.
     */
    constructor(
        private queue: QueueManager
    ) {}

    /**
     * Rota de criação (POST) de uma nova tarefa de extração de detalhes da vaga.
     * Cria a tarefa com status inicial 'IDLE' e a insere na fila de processamento.
     * 
     * @param request A requisição Fastify com o corpo no formato CreateTaskBody.
     * @param reply A resposta HTTP Fastify correspondente.
     * @returns Resposta com status 201 e a tarefa agendada em formato JSON.
     */
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

    /**
     * Rota de consulta (GET) de tarefas existentes.
     * Permite obter os detalhes e o progresso de tarefas por ID ou listagens paginadas.
     * 
     * @param request A requisição Fastify contendo parâmetros da query (GetTaskResultQuery).
     * @param reply A resposta HTTP Fastify correspondente.
     * @returns Resposta com status 200 e os resultados das tarefas em formato JSON.
     */
    async getTaskResult(request: FastifyRequest, reply: FastifyReply) {
        const queries = request.query as GetTaskResultQuery
        const result = await this.queue.getTask(queries)

        return reply.status(200).send({
            ok: true,
            data: result
        })
    }
}
