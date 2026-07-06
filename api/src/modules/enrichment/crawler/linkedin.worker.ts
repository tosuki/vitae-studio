import { Job } from "bullmq";
import { getLinkedinJobRawDetails } from "./linkedin";
import { getTaskService, getQueueManager } from "../factory";
import { QueueManager } from "../queue";
import { TaskService } from "../services/task.service";
import { logger } from "../../../util/logger";

export const linkedinWorkerHandler = async (job: Job<{ taskId: string; linkedinJobId: string }>): Promise<void> => {
    const { taskId, linkedinJobId } = job.data;
    const taskService: TaskService = getTaskService();
    const queueManager: QueueManager = getQueueManager();

    if (job.attemptsMade === 0) {
        await taskService.updateTask(taskId, { status: "EXTRACTING_LINKEDIN" });
    }

    const result = await getLinkedinJobRawDetails(linkedinJobId);

    if (result.err) {
        const attemptsLimit: number = job.opts.attempts || 1;
        const isLastAttempt: boolean = job.attemptsMade >= attemptsLimit - 1;

        logger.warn(result.err, `Scraping do LinkedIn falhou para a Task ${taskId} (Tentativa ${job.attemptsMade + 1}/${attemptsLimit})`);

        if (isLastAttempt) {
            await taskService.updateTask(taskId, {
                status: "FAILED",
                errorMessage: `Extração do LinkedIn falhou definitivamente após ${attemptsLimit} tentativas: ${result.err.message}`
            });
        } else {
            await taskService.updateTask(taskId, {
                errorMessage: `Tentativa ${job.attemptsMade + 1} falhou: ${result.err.message}. Aguardando retry...`
            });
        }

        throw result.err;
    }

    const rawHtml: string = result.data;
    await taskService.updateTask(taskId, {
        status: "EXTRACTING_GEMINI",
        rawHtml,
        errorMessage: null
    });

    await queueManager.addGeminiJob(taskId, rawHtml);
};
