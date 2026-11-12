import { Job, UnrecoverableError } from "bullmq";
import { enrichCVWithAI, extractCVFromTextWithAI, curateCVWithAI } from "./gemini";
import { getTaskService } from "../factory";
import { TaskService } from "../services/task.service";
import { GeminiQuotaExhaustedError } from "../../../util/errors";
import { logger } from "../../../util/logger";
import { CVData } from "../../common/model/cv.model";
import { JobCurationInput } from "./curation.prompt";

export type GeminiJobData =
    | { taskId: string; rawHtml: string; cv: CVData; rawResumeText?: undefined; jobCuration?: undefined }
    | { taskId: string; rawResumeText: string; rawHtml?: undefined; cv?: undefined; jobCuration?: undefined }
    | { taskId: string; jobCuration: JobCurationInput; cv: CVData; rawHtml?: undefined; rawResumeText?: undefined };

async function handleWorkerError(
    err: Error,
    actionLabel: string,
    taskId: string,
    job: Job<GeminiJobData>,
    taskService: TaskService
): Promise<never> {
    const attemptsLimit: number = job.opts.attempts || 1;
    const isLastAttempt: boolean = job.attemptsMade >= attemptsLimit - 1;

    logger.warn(err, `Integração de IA falhou para a Task ${taskId} (Tentativa ${job.attemptsMade + 1}/${attemptsLimit})`);

    const isRecoverable: boolean = err instanceof GeminiQuotaExhaustedError;

    if (!isRecoverable || isLastAttempt) {
        const errorMessage = isLastAttempt
            ? `${actionLabel} falhou definitivamente após ${attemptsLimit} tentativas: ${err.message}`
            : `Falha na ${actionLabel.toLowerCase()}: ${err.message}`;

        await taskService.updateTask(taskId, {
            status: "FAILED",
            errorMessage
        });

        if (!isRecoverable) {
            throw new UnrecoverableError(err.message);
        }
    } else {
        await taskService.updateTask(taskId, {
            errorMessage: `Tentativa ${job.attemptsMade + 1} falhou por limite de taxa: ${err.message}. Aguardando retry automático...`
        });
    }

    throw err;
}

export const geminiWorkerHandler = async (job: Job<GeminiJobData>): Promise<void> => {
    const { taskId } = job.data;
    const taskService: TaskService = getTaskService();

    if (job.attemptsMade === 0) {
        await taskService.updateTask(taskId, { status: "EXTRACTING_GEMINI" });
    }

    if (job.data.jobCuration && job.data.cv) {
        const curationResult = await curateCVWithAI(job.data.jobCuration, job.data.cv);
        if (curationResult.err) {
            return await handleWorkerError(curationResult.err, "Curadoria de vaga por IA", taskId, job, taskService);
        }
        await taskService.updateTask(taskId, {
            status: "DONE",
            curationResult: curationResult.data,
            errorMessage: null
        });
        return;
    }

    if (typeof job.data.rawResumeText === "string") {
        const parseResult = await extractCVFromTextWithAI(job.data.rawResumeText);
        if (parseResult.err) {
            return await handleWorkerError(parseResult.err, "Extração de currículo por IA", taskId, job, taskService);
        }
        await taskService.updateTask(taskId, {
            status: "DONE",
            enrichedCV: parseResult.data,
            errorMessage: null
        });
        return;
    }

    const enrichResult = await enrichCVWithAI(job.data.rawHtml!, job.data.cv!);
    if (enrichResult.err) {
        return await handleWorkerError(enrichResult.err, "Otimização por IA", taskId, job, taskService);
    }
    await taskService.updateTask(taskId, {
        status: "DONE",
        enrichedCV: enrichResult.data,
        errorMessage: null
    });
};
