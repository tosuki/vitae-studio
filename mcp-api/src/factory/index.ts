import { Handler } from "../handlers/handler"
import { QueueManager } from "../queue/queue"
import { QueueWorker } from "../queue/worker"

let queueManagerInstance: QueueManager | null = null
let workerManagerInstance: QueueWorker | null = null

let geminiHandlerInstance: Handler | null = null
let jobVacancyHandlerInstance: Handler | null = null

export function getQueueManagerInstance(): QueueManager {
    if (!queueManagerInstance) {
        queueManagerInstance = new QueueManager()
    }
    return queueManagerInstance
}

export function getJobVacancyHandlerInstance(): Handler {
    if (!jobVacancyHandlerInstance) {
        throw new Error("Not implemented yet")
    }

    return jobVacancyHandlerInstance
}

export function getGeminiHandlerInstance(): Handler {
    if (!geminiHandlerInstance) {
        throw new Error("Not implemented yet")
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