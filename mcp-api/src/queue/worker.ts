import { Worker, Job as BullMQJob } from "bullmq"
import { Handler } from "../handlers/handler"
import { env } from "../env"
import { queueConfig } from "./queue"
import { Job as ModelJob } from "../model/job"
import { logger } from "../logger/logger"

/**
 * Gerencia a execução de tarefas assíncronas consumindo filas do BullMQ.
 * Inicializa instâncias separadas de Workers para processamento de scraping e análises de IA.
 * 
 * @example
 * ```typescript
 * const worker = new QueueWorker(geminiHandler, jobVacancyHandler);
 * worker.startWorker();
 * ```
 */
export class QueueWorker {
    private detailsWorkerInstance: Worker | null = null
    private geminiWorkerInstance: Worker | null = null

    /**
     * Cria um QueueWorker.
     * @param geminiWorker Processador responsável pela otimização e IA (Gemini).
     * @param jobVacancyWorker Processador responsável por buscar detalhes de vagas (Scraper).
     */
    constructor(
        private geminiWorker: Handler,
        private jobVacancyWorker: Handler
    ) {}

    /**
     * Inicializa os workers e começa a escutar as filas no Redis correspondentes.
     * 
     * @example
     * ```typescript
     * worker.startWorker();
     * ```
     */
    startWorker() {
        logger.info("[QueueWorker] Inicializando processadores (Workers) das filas no Redis...")

        logger.info(`[QueueWorker] Inicializando Worker de Detalhes de Vagas para a fila: ${env.JOB_VACANCY_DETAILS_QUEUE}`)
        this.detailsWorkerInstance = new Worker(
            env.JOB_VACANCY_DETAILS_QUEUE,
            async (bullJob: BullMQJob) => {
                const modelJob = bullJob.data as ModelJob
                logger.info(`[QueueWorker:Details] Processando job ${bullJob.id} (ID Modelo: ${modelJob.id})`)
                
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
        logger.info(`[QueueWorker] Worker de Detalhes de Vagas ativo e escutando na fila: ${env.JOB_VACANCY_DETAILS_QUEUE}`)

        logger.info(`[QueueWorker] Inicializando Worker do Gemini para a fila: ${env.GEMINI_QUEUE_NAME}`)
        this.geminiWorkerInstance = new Worker(
            env.GEMINI_QUEUE_NAME,
            async (bullJob: BullMQJob) => {
                const modelJob = bullJob.data as ModelJob
                logger.info(`[QueueWorker:Gemini] Processando job ${bullJob.id} (ID Modelo: ${modelJob.id})`)

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
        logger.info(`[QueueWorker] Worker do Gemini ativo e escutando na fila: ${env.GEMINI_QUEUE_NAME}`)

        this.detailsWorkerInstance.on("error", (err) => {
            logger.critical("[QueueWorker:Details] Erro crítico no worker do Redis:", err)
        })

        this.geminiWorkerInstance.on("error", (err) => {
            logger.critical("[QueueWorker:Gemini] Erro crítico no worker do Redis:", err)
        })

        logger.info("[QueueWorker] Todos os Workers foram carregados e iniciados com sucesso.")
    }

    /**
     * Encerra de forma suave a escuta dos workers, aguardando a conclusão das tarefas ativas.
     * 
     * @example
     * ```typescript
     * await worker.close();
     * ```
     */
    async close() {
        logger.info("[QueueWorker] Finalizando escuta dos workers...")
        await Promise.all([
            this.detailsWorkerInstance?.close(),
            this.geminiWorkerInstance?.close()
        ])
        logger.info("[QueueWorker] Workers desligados.")
    }
}