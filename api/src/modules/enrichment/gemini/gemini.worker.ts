import { Job, UnrecoverableError } from "bullmq";
import { enrichCVWithAI, extractCVFromTextWithAI } from "./gemini";
import { getTaskService } from "../factory";
import { TaskService } from "../services/task.service";
import { GeminiQuotaExhaustedError } from "../../../util/errors";
import { logger } from "../../../util/logger";
import { CVData } from "../../common/model/cv.model";

export type GeminiJobData =
    | { taskId: string; rawHtml: string; cv: CVData; rawResumeText?: undefined }
    | { taskId: string; rawResumeText: string; rawHtml?: undefined; cv?: undefined };

export const geminiWorkerHandler = async (job: Job<GeminiJobData>): Promise<void> => {
    const { taskId } = job.data;

    const taskService: TaskService = getTaskService();

    if (job.attemptsMade === 0) {
        await taskService.updateTask(taskId, { status: "EXTRACTING_GEMINI" });
    }

    const rawResumeText = job.data.rawResumeText;
    const isResumeParse = typeof rawResumeText === "string";
    const result = isResumeParse
        ? await extractCVFromTextWithAI(rawResumeText)
        : await enrichCVWithAI(job.data.rawHtml!, job.data.cv!);

    if (result.err) {
        const attemptsLimit: number = job.opts.attempts || 1;
        const isLastAttempt: boolean = job.attemptsMade >= attemptsLimit - 1;
        const actionLabel = isResumeParse ? "Extração de currículo por IA" : "Otimização por IA";

        logger.warn(result.err, `Integração de IA falhou para a Task ${taskId} (Tentativa ${job.attemptsMade + 1}/${attemptsLimit})`);

        const isRecoverable: boolean = result.err instanceof GeminiQuotaExhaustedError;

        if (!isRecoverable || isLastAttempt) {
            const errorMessage = isLastAttempt
                ? `${actionLabel} falhou definitivamente após ${attemptsLimit} tentativas: ${result.err.message}`
                : `Falha na ${actionLabel.toLowerCase()}: ${result.err.message}`;

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

    const extractedData: Omit<CVData, "style"> = result.data;

    await taskService.updateTask(taskId, {
        status: "DONE",
        enrichedCV: extractedData,
        errorMessage: null
    });
};
