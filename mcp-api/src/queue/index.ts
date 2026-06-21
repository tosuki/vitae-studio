import { Queue } from "bullmq"
import { Job, JobState, JobType } from "../model/job"

import { env } from "../env"
import { v4 as uuid } from "uuid"


export class QueueManager {
    private puppeteerQueue: Queue = new Queue(env.PUPPETEER_QUEUE_NAME, {
        connection: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT
        }
    })

    private geminiQueue: Queue = new Queue(env.GEMINI_QUEUE_NAME, {
        connection: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT
        }
    })

    createTask(data: Omit<Job, keyof JobState | "id" | "createdAt" | "updatedAt">) {
        const id = uuid()
        const now = Date.now()

        const job = {
            id,
            state: "IDLE",
            createdAt: now,
            updatedAt: now,
            ...data
        } as Job

        switch (job.type) {
            case "gemini":
                this.geminiQueue.add(id, job)
                break
            case "details":
                this.puppeteerQueue.add(id, job)
                break
            default:
                throw new Error("Job type not supported")
        }
    }
}