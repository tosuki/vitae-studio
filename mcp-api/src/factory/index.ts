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

export function getBrowserClusterInstance(): BrowserCluster {
    if (!browserClusterInstance) {
        browserClusterInstance = new BrowserCluster()
    }

    return browserClusterInstance
}

export function getQueueManagerInstance(): QueueManager {
    if (!queueManagerInstance) {
        queueManagerInstance = new QueueManager()
    }
    return queueManagerInstance
}

export function getJobVacancyHandlerInstance(): Handler {
    if (!jobVacancyHandlerInstance) {
        jobVacancyHandlerInstance = new JobVacancyHandler(getBrowserClusterInstance())
    }

    return jobVacancyHandlerInstance
}

export function getGeminiHandlerInstance(): Handler {
    if (!geminiHandlerInstance) {
        geminiHandlerInstance = new GeminiHandler()
    }

    return geminiHandlerInstance
}

export function getWorkerManagerInstance(): QueueWorker {
    if (!workerManagerInstance) {
        workerManagerInstance = new QueueWorker(
            getGeminiHandlerInstance(),
            getJobVacancyHandlerInstance()
        )
    }

    return workerManagerInstance!
}

export function getTaskHttpControllerInstance(): TaskController {
    if (!taskHttpControllerInstance) {
        taskHttpControllerInstance = new TaskController(getQueueManagerInstance())
    }

    return taskHttpControllerInstance
}

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
