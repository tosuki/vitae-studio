import { Queue, QueueEvents } from "bullmq"
import { Job } from "../model/job"
import { v4 as uuid } from "uuid"
import { env } from "../env"
import { UnsupportedJobTypeError } from "../error/error"
import { logger } from "../logger/logger"

/**
 * Opções de paginação e filtragem ao recuperar tarefas das filas.
 */
export type GetTaskOpts = {
    /** ID único da tarefa (opcional). */
    id?: string
    /** Limite máximo de registros a retornar por fila. */
    limit?: number
    /** Deslocamento (offset) para a paginação das filas. */
    offset?: number
    /** Filtrar por tipo específico de fila ou buscar em todas ("all"). */
    type?: "all" | "details" | "gemini"
}

/**
 * Configuração de conexão com o Redis e políticas padrão para Jobs do BullMQ.
 */
export const queueConfig = { 
    connection: {
        port: Number(env.REDIS_PORT),
        host: env.REDIS_HOST
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: { count: 100 }, // Mantém apenas as últimas 100 tarefas concluídas no cache
        removeOnFail: { count: 500 },     // Mantém até 500 tarefas falhas para diagnóstico
    }
}

/**
 * Gerencia a comunicação com as filas do BullMQ para tarefas assíncronas do sistema
 * (Scraping de vagas e chamadas à API do Gemini), incluindo a escuta de eventos globais.
 * 
 * @example
 * ```typescript
 * const queueManager = new QueueManager();
 * 
 * // Cria uma nova tarefa na fila de Scraping
 * const job = await queueManager.createTask({
 *     type: "details",
 *     url: "https://linkedin.com/jobs/view/123",
 *     state: "IDLE"
 * });
 * 
 * logger.info(`Tarefa criada com ID: ${job.id}`);
 * ```
 */
export class QueueManager {
    private jobVacancyDetailsQueue = new Queue(env.JOB_VACANCY_DETAILS_QUEUE, queueConfig)
    private geminiQueue = new Queue(env.GEMINI_QUEUE_NAME, queueConfig)
    
    // QueueEvents ouvem as atualizações de estado globais das filas no Redis em tempo real
    private jobVacancyDetailsEvents = new QueueEvents(env.JOB_VACANCY_DETAILS_QUEUE, { connection: queueConfig.connection })
    private geminiEvents = new QueueEvents(env.GEMINI_QUEUE_NAME, { connection: queueConfig.connection })
    
    constructor() {
        logger.info(`[QueueManager] Inicializando fila de Detalhes de Vagas (${env.JOB_VACANCY_DETAILS_QUEUE}) e eventos do Redis...`)
        logger.info(`[QueueManager] Inicializando fila do Gemini (${env.GEMINI_QUEUE_NAME}) e eventos do Redis...`)
        this.setupEventsListeners()
        logger.info("[QueueManager] Filas e ouvintes de eventos inicializados com sucesso.")
    }

    /**
     * Vincula ouvintes de eventos para monitorar progresso, sucesso e falhas
     * em tempo real nas filas de Scraping e IA (Gemini).
     */
    private setupEventsListeners() {
        // Escuta de eventos para a fila de Scraping
        this.jobVacancyDetailsEvents.on("completed", ({ jobId }) => {
            logger.info(`[QueueEvents:Details] Job ${jobId} concluído com sucesso.`)
        })
        this.jobVacancyDetailsEvents.on("failed", ({ jobId, failedReason }) => {
            logger.error(`[QueueEvents:Details] Job ${jobId} falhou. Motivo: ${failedReason}`)
        })
        this.jobVacancyDetailsEvents.on("progress", ({ jobId, data }) => {
            logger.info(`[QueueEvents:Details] Progresso do Job ${jobId}: ${data}%`)
        })

        // Escuta de eventos para a fila de IA (Gemini)
        this.geminiEvents.on("completed", ({ jobId }) => {
            logger.info(`[QueueEvents:Gemini] Job ${jobId} concluído com sucesso.`)
        })
        this.geminiEvents.on("failed", ({ jobId, failedReason }) => {
            logger.error(`[QueueEvents:Gemini] Job ${jobId} falhou. Motivo: ${failedReason}`)
        })
        this.geminiEvents.on("progress", ({ jobId, data }) => {
            logger.info(`[QueueEvents:Gemini] Progresso do Job ${jobId}: ${data}%`)
        })
    }

    /**
     * Obtém um Job específico da fila do Gemini.
     * @param id ID único da tarefa.
     */
    getGeminiQueueTask(id: string) {
        return this.geminiQueue.getJob(id)
    }

    /**
     * Obtém um Job específico da fila de scraping de vagas.
     * @param id ID único da tarefa.
     */
    getJobVacancyDetailsQueueTask(id: string) {
        return this.jobVacancyDetailsQueue.getJob(id)
    }

    /**
     * Retorna o escutador de eventos nativo da fila Gemini.
     */
    getGeminiEvents() {
        return this.geminiEvents
    }

    /**
     * Retorna o escutador de eventos nativo da fila de scraping.
     */
    getJobVacancyDetailsEvents() {
        return this.jobVacancyDetailsEvents
    }

    /**
     * Recupera o status e resultado de um Job específico buscando de forma
     * concorrente em todas as filas registradas do Redis, ou pagina as listas de Jobs.
     * 
     * @param opts Opções de busca (ID, limites, paginação, tipo).
     * @returns O Job correspondente, ou lista de Jobs paginados.
     * 
     * @example
     * ```typescript
     * const job = await queueManager.getTask({ id: "job-uuid-aqui" });
     * if (job && !Array.isArray(job)) {
     *     const state = await job.getState();
     *     logger.info(`Status: ${state}, Progresso: ${job.progress}%`);
     * }
     * ```
     */
    async getTask(opts: GetTaskOpts = {
        limit: 10,
        offset: 0,
        type: "all"
    }) {
        if (opts.id) {
            return await this.getTaskById(opts.id)
        }

        switch (opts.type) {
            case "all":
                const [jobVacancyJobs, geminiJobs] = await Promise.all([
                    this.getAllGeminiJobs(opts),
                    this.getAllJobVacancyJobs(opts)
                ])

                return [...jobVacancyJobs, ...geminiJobs]
            case "details":
                return await this.getAllJobVacancyJobs(opts)
            case "gemini":
                return await this.getAllGeminiJobs(opts)
            default:
                throw new UnsupportedJobTypeError(`Type ${opts.type} not supported`)
        }
    }

    /**
     * Lista jobs paginados da fila do Gemini.
     * @param opts Opções de limites e deslocamento.
     */
    async getAllGeminiJobs(opts: Pick<GetTaskOpts, "limit" | "offset"> = { limit: 10, offset: 0 }) {
        const jobs = await this.geminiQueue.getJobs()

        return jobs.slice(opts.offset!*opts.limit!, opts.limit!)
    }

    /**
     * Lista jobs paginados da fila de scraping de vagas.
     * @param opts Opções de limites e deslocamento.
     */
    async getAllJobVacancyJobs(opts: Pick<GetTaskOpts, "limit" | "offset"> = { limit: 10, offset: 0 }) {
        const jobs = await this.jobVacancyDetailsQueue.getJobs()

        return jobs.slice(opts.offset!*opts.limit!, opts.limit!)
    }

    /**
     * Busca por ID em ambas as filas concorrentemente.
     * @param id ID único da tarefa.
     */
    async getTaskById(id: string) {
        const [geminiTask, jobVacancyTask] = await Promise.all([
            this.geminiQueue.getJob(id),
            this.jobVacancyDetailsQueue.getJob(id)
        ])

        return geminiTask || jobVacancyTask
    }

    /**
     * Agenda uma nova tarefa assíncrona inserindo-a na fila correta com base no tipo.
     * Garante que o agendamento no Redis seja concluído com sucesso antes de retornar o objeto do Job.
     * 
     * @param jobData Dados iniciais da tarefa (excluindo id, progresso e timestamps)
     * @returns A entidade de modelo do Job criada com ID único (UUID) e timestamps
     * 
     * @example
     * ```typescript
     * const job = await queueManager.createTask({
     *     type: "gemini",
     *     vacancy: { name: "Dev React", description: "Requisitos...", requirements: [], createdAt: Date.now(), createdBy: "user" },
     *     state: "IDLE"
     * });
     * ```
     */
    async createTask(jobData: Omit<Job, "progress" | "id" | "createdAt" | "updatedAt">) {
        const id = uuid()
        const now = Date.now()
        
        const job = {
            ...jobData,
            id,
            createdAt: now,
            updatedAt: now,
        } as Job

        switch (job.type) {
            case "details":
                await this.jobVacancyDetailsQueue.add(job.id, job)
                break
            case "gemini":
                await this.geminiQueue.add(job.id, job)
                break
            default:
                throw new UnsupportedJobTypeError(`Job type ${jobData.type} not supported`)
        }

        return job
    }

    /**
     * Fecha de forma suave todas as conexões de rede com o Redis (filas e eventos).
     * Deve ser invocado no desligamento da aplicação para evitar vazamento de conexões (sockets).
     * 
     * @example
     * ```typescript
     * process.on("SIGINT", async () => {
     *     await queueManager.close();
     *     process.exit(0);
     * });
     * ```
     */
    async close() {
        await Promise.all([
            this.jobVacancyDetailsQueue.close(),
            this.geminiQueue.close(),
            this.jobVacancyDetailsEvents.close(),
            this.geminiEvents.close()
        ])
        logger.info("[QueueManager] Todas as filas e eventos encerrados.")
    }
}