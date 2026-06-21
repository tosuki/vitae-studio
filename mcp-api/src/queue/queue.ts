import { Queue, QueueEvents } from "bullmq"
import { Job } from "../model/job"
import { v4 as uuid } from "uuid"
import { env } from "../env"

export const queueConfig = { 
    connection: {
        port: env.REDIS_PORT,
        host: env.REDIS_HOST
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
    }
}

export class QueueManager {
    private jobVacancyDetailsQueue = new Queue(env.JOB_VACANCY_DETAILS_QUEUE, queueConfig)
    private geminiQueue = new Queue(env.GEMINI_QUEUE_NAME, queueConfig)
    
    private jobVacancyDetailsEvents = new QueueEvents(env.JOB_VACANCY_DETAILS_QUEUE, { connection: queueConfig.connection })
    private geminiEvents = new QueueEvents(env.GEMINI_QUEUE_NAME, { connection: queueConfig.connection })
    
    constructor() {
        this.setupEventsListeners()
    }

    private setupEventsListeners() {
        this.jobVacancyDetailsEvents.on("completed", ({ jobId }) => {
            console.log(`[QueueEvents:Details] Job ${jobId} concluído com sucesso.`)
        })
        this.jobVacancyDetailsEvents.on("failed", ({ jobId, failedReason }) => {
            console.error(`[QueueEvents:Details] Job ${jobId} falhou. Motivo: ${failedReason}`)
        })
        this.jobVacancyDetailsEvents.on("progress", ({ jobId, data }) => {
            console.log(`[QueueEvents:Details] Progresso do Job ${jobId}: ${data}%`)
        })

        this.geminiEvents.on("completed", ({ jobId }) => {
            console.log(`[QueueEvents:Gemini] Job ${jobId} concluído com sucesso.`)
        })
        this.geminiEvents.on("failed", ({ jobId, failedReason }) => {
            console.error(`[QueueEvents:Gemini] Job ${jobId} falhou. Motivo: ${failedReason}`)
        })
        this.geminiEvents.on("progress", ({ jobId, data }) => {
            console.log(`[QueueEvents:Gemini] Progresso do Job ${jobId}: ${data}%`)
        })
    }

    getGeminiQueueTask(id: string) {
        return this.geminiQueue.getJob(id)
    }

    getJobVacancyDetailsQueueTask(id: string) {
        return this.jobVacancyDetailsQueue.getJob(id)
    }

    getGeminiEvents() {
        return this.geminiEvents
    }

    getJobVacancyDetailsEvents() {
        return this.jobVacancyDetailsEvents
    }

    async getTask(id: string) {
        const [geminiTask, jobVacancyDetailsTask] = await Promise.all([
            this.getGeminiQueueTask(id),
            this.getJobVacancyDetailsQueueTask(id)
        ])
        
        return geminiTask || jobVacancyDetailsTask
    }

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
                throw new Error(`Job type ${jobData.type} not supported`)
        }

        return job
    }

    async close() {
        await Promise.all([
            this.jobVacancyDetailsQueue.close(),
            this.geminiQueue.close(),
            this.jobVacancyDetailsEvents.close(),
            this.geminiEvents.close()
        ])
        console.log("[QueueManager] Todas as filas e eventos encerrados.")
    }
}