import { Worker, Job as BullMQJob } from "bullmq"
import { Handler } from "../handlers/handler"
import { env } from "../env"
import { queueConfig } from "./queue"
import { Job as ModelJob } from "../model/job"

export class QueueWorker {
    private detailsWorkerInstance: Worker | null = null
    private geminiWorkerInstance: Worker | null = null

    constructor(
        private geminiWorker: Handler,
        private jobVacancyWorker: Handler
    ) {}

    startWorker() {
        console.log("[QueueWorker] Inicializando workers das filas...")

        this.detailsWorkerInstance = new Worker(
            env.JOB_VACANCY_DETAILS_QUEUE,
            async (bullJob: BullMQJob) => {
                const modelJob = bullJob.data as ModelJob
                console.log(`[QueueWorker:Details] Processando job ${bullJob.id} (ID Modelo: ${modelJob.id})`)
                
                const result = await this.jobVacancyWorker.handle(modelJob, async (progress: number) => {
                    await bullJob.updateProgress(progress)
                })

                return result
            },
            {
                connection: queueConfig.connection,
                concurrency: 1,
            }
        )

        this.geminiWorkerInstance = new Worker(
            env.GEMINI_QUEUE_NAME,
            async (bullJob: BullMQJob) => {
                const modelJob = bullJob.data as ModelJob
                console.log(`[QueueWorker:Gemini] Processando job ${bullJob.id} (ID Modelo: ${modelJob.id})`)

                // Executa a lógica de análise e otimização IA no handler
                const result = await this.geminiWorker.handle(modelJob, async (progress: number) => {
                    await bullJob.updateProgress(progress)
                })

                return result
            },
            {
                connection: queueConfig.connection,
                concurrency: 2,
            }
        )

        this.detailsWorkerInstance.on("error", (err) => {
            console.error("[QueueWorker:Details] Erro crítico no worker do Redis:", err)
        })

        this.geminiWorkerInstance.on("error", (err) => {
            console.error("[QueueWorker:Gemini] Erro crítico no worker do Redis:", err)
        })

        console.log("[QueueWorker] Workers de Detalhes e Gemini iniciados com sucesso.")
    }

    async close() {
        console.log("[QueueWorker] Finalizando escuta dos workers...")
        await Promise.all([
            this.detailsWorkerInstance?.close(),
            this.geminiWorkerInstance?.close()
        ])
        console.log("[QueueWorker] Workers desligados.")
    }
}