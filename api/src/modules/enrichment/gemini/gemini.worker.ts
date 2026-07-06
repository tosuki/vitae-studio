import { Job, UnrecoverableError } from "bullmq";
import { extractJobInfoWithGemini, ExtractedResume } from "./gemini";
import { getTaskService } from "../factory";
import { TaskService } from "../services/task.service";
import { GeminiQuotaExhaustedError } from "../../../util/errors";
import { logger } from "../../../util/logger";

export const geminiWorkerHandler = async (job: Job<{ taskId: string; rawHtml: string }>): Promise<void> => {
    const { taskId, rawHtml } = job.data;
    const taskService: TaskService = getTaskService();

    if (job.attemptsMade === 0) {
        await taskService.updateTask(taskId, { status: "EXTRACTING_GEMINI" });
    }

    const result = await extractJobInfoWithGemini(rawHtml);

    if (result.err) {
        const attemptsLimit: number = job.opts.attempts || 1;
        const isLastAttempt: boolean = job.attemptsMade >= attemptsLimit - 1;

        logger.warn(result.err, `Integração do Gemini falhou para a Task ${taskId} (Tentativa ${job.attemptsMade + 1}/${attemptsLimit})`);

        const isRecoverable: boolean = result.err instanceof GeminiQuotaExhaustedError;

        if (!isRecoverable || isLastAttempt) {
            const errorMessage = isLastAttempt
                ? `Extração do Gemini falhou definitivamente após ${attemptsLimit} tentativas: ${result.err.message}`
                : `Falha crítica e definitiva na extração: ${result.err.message}`;

            await taskService.updateTask(taskId, {
                status: "FAILED",
                errorMessage
            });

            if (!isRecoverable) {
                throw new UnrecoverableError(result.err.message);
            }
        } else {
            await taskService.updateTask(taskId, {
                errorMessage: `Tentativa ${job.attemptsMade + 1} falhou por limite de taxa: ${result.err.message}. Aguardando retry automático...`
            });
        }

        throw result.err;
    }

    const extractedData: ExtractedResume = result.data;
    await taskService.updateTask(taskId, {
        status: "DONE",
        extractedJson: JSON.stringify(extractedData),
        errorMessage: null
    });
};
