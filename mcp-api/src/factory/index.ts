import { BrowserCluster } from "../browser/browser"
import { GeminiHandler } from "../handlers/gemini"
import { Handler } from "../handlers/handler"
import { JobVacancyHandler } from "../handlers/vacancy"
import { TaskController } from "../http/controller/task.controller"
import { QueueManager } from "../queue/queue"
import { QueueWorker } from "../queue/worker"
import { logger } from "../logger/logger"

let queueManagerInstance: QueueManager | null = null
let workerManagerInstance: QueueWorker | null = null

let browserClusterInstance: BrowserCluster | null = null

let geminiHandlerInstance: Handler | null = null
let jobVacancyHandlerInstance: Handler | null = null

let taskHttpControllerInstance: TaskController | null = null

/**
 * Inicializa ou retorna a instância Singleton do gerenciador do navegador Puppeteer (BrowserCluster).
 * Garante que apenas uma pool de navegadores esteja ativa em toda a aplicação.
 * 
 * @returns A instância global compartilhada do BrowserCluster.
 */
export function getBrowserClusterInstance(): BrowserCluster {
    if (!browserClusterInstance) {
        browserClusterInstance = new BrowserCluster()
    }

    return browserClusterInstance
}

/**
 * Inicializa ou retorna a instância Singleton do gerenciador de filas BullMQ (QueueManager).
 * 
 * @returns A instância global compartilhada do QueueManager.
 */
export function getQueueManagerInstance(): QueueManager {
    if (!queueManagerInstance) {
        queueManagerInstance = new QueueManager()
    }
    return queueManagerInstance
}

/**
 * Inicializa ou retorna a instância Singleton do processador de scraping de vagas (JobVacancyHandler).
 * Injeta o Singleton do BrowserCluster como dependência.
 * 
 * @returns A instância do processador de scraping que implementa a interface Handler.
 */
export function getJobVacancyHandlerInstance(): Handler {
    if (!jobVacancyHandlerInstance) {
        jobVacancyHandlerInstance = new JobVacancyHandler(getBrowserClusterInstance())
    }

    return jobVacancyHandlerInstance
}

/**
 * Inicializa ou retorna a instância Singleton do processador de inteligência artificial (GeminiHandler).
 * 
 * @returns A instância do processador de IA que implementa a interface Handler.
 */
export function getGeminiHandlerInstance(): Handler {
    if (!geminiHandlerInstance) {
        geminiHandlerInstance = new GeminiHandler()
    }

    return geminiHandlerInstance
}

/**
 * Inicializa ou retorna a instância Singleton do gerenciador de trabalhadores em background (QueueWorker).
 * Injeta ambos os Handlers (Gemini e Scraping) como dependências.
 * 
 * @returns A instância global do QueueWorker.
 */
export function getWorkerManagerInstance(): QueueWorker {
    if (!workerManagerInstance) {
        workerManagerInstance = new QueueWorker(
            getGeminiHandlerInstance(),
            getJobVacancyHandlerInstance()
        )
    }

    return workerManagerInstance!
}

/**
 * Inicializa ou retorna a instância Singleton do controlador HTTP de tarefas (TaskController).
 * Injeta o QueueManager para criação de Jobs a partir de requisições HTTP.
 * 
 * @returns A instância global do TaskController.
 */
export function getTaskHttpControllerInstance(): TaskController {
    if (!taskHttpControllerInstance) {
        taskHttpControllerInstance = new TaskController(getQueueManagerInstance())
    }

    return taskHttpControllerInstance
}

/**
 * Realiza o encerramento ordenado e suave (graceful shutdown) de todas as conexões e recursos
 * inicializados pela factory (conexões com Redis do BullMQ e processos órfãos do Chrome/Puppeteer).
 * 
 * @example
 * ```typescript
 * await shutdownInstances();
 * ```
 */
export async function shutdownInstances(): Promise<void> {
    logger.info("[Factory] Iniciando encerramento suave das instâncias...")
    if (workerManagerInstance) {
        await workerManagerInstance.close()
        workerManagerInstance = null
    }
    if (queueManagerInstance) {
        await queueManagerInstance.close()
        queueManagerInstance = null
    }
    if (browserClusterInstance) {
        await browserClusterInstance.close()
        browserClusterInstance = null
    }
    logger.info("[Factory] Instâncias encerradas com sucesso.")
}
