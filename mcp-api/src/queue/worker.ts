import { Worker, ConnectionOptions } from "bullmq";
import { Job as VitaeJob } from "../model/job";

import { env } from "../env"

export class VitaeWorker {
    private geminiWorker: Worker | null = null
    private puppeteerWorker: Worker | null = null
    private queueConnection: ConnectionOptions = {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT
    }

    private initializeGeminiWorker() {
        this.geminiWorker = new Worker(env.GEMINI_QUEUE_NAME, async (job) => {
            const payload = job.data as VitaeJob

            if (payload.type !== "gemini") {
                await job.remove()
            }

        }, { connection: this.queueConnection })
    }

    private initializePuppeteerWorker() {
        this.puppeteerWorker = new Worker(env.PUPPETEER_QUEUE_NAME, async (job) => {

        }, { connection: this.queueConnection })
    }

    public initialize() {
        
    }

    public stop() {}
} 