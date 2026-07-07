import { Queue, Worker } from "bullmq";
import { linkedinWorkerHandler } from "./crawler/linkedin.worker";
import { geminiWorkerHandler } from "./gemini/gemini.worker";
import env from "../../env";
import { logger } from "../../util/logger";
import { CVData } from "./model/cv.model";

export class QueueManager {
    private linkedinQueue: Queue;
    private geminiQueue: Queue;
    private linkedinWorker: Worker | null = null;
    private geminiWorker: Worker | null = null;

    constructor() {
        const connection = {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT
        };

        this.linkedinQueue = new Queue("linkedin-extraction", {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 10000
                },
                removeOnComplete: true,
                removeOnFail: false
            }
        });

        this.geminiQueue = new Queue("gemini-extraction", {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 15000
                },
                removeOnComplete: true,
                removeOnFail: false
            }
        });
    }

    public async addLinkedinJob(taskId: string, linkedinJobId: string, cv: CVData) {
        await this.linkedinQueue.add("extract-linkedin", { taskId, linkedinJobId, cv });
    }

    public async addGeminiJob(taskId: string, rawHtml: string, cv: CVData) {
        await this.geminiQueue.add("extract-gemini", { taskId, rawHtml, cv });
    }

    public startWorkers() {
        const connection = {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT
        };

        this.linkedinWorker = new Worker(
            "linkedin-extraction",
            linkedinWorkerHandler,
            {
                connection,
                concurrency: 2
            }
        );

        this.geminiWorker = new Worker(
            "gemini-extraction",
            geminiWorkerHandler,
            {
                connection,
                concurrency: 1,
                limiter: {
                    max: 5,
                    duration: 60000
                }
            }
        );

        this.linkedinWorker.on("failed", (job, err) => {
            logger.error(err, `Linkedin Worker failed on job ${job?.id}`);
        });

        this.geminiWorker.on("failed", (job, err) => {
            logger.error(err, `Gemini Worker failed on job ${job?.id}`);
        });
    }

    public async shutdown() {
        if (this.linkedinWorker) {
            await this.linkedinWorker.close();
        }
        if (this.geminiWorker) {
            await this.geminiWorker.close();
        }
        await this.linkedinQueue.close();
        await this.geminiQueue.close();
    }
}
