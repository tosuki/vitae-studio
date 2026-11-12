import { FastifyReply, FastifyRequest } from "fastify";
import { getTaskService } from "../../enrichment/factory";
import { CreateTaskDTO } from "../../enrichment/dtos/create-task.dto";
import { CVData } from "../../common/model/cv.model";
import { JobCurationInput } from "../../enrichment/gemini/curation.prompt";
import { validateResumeFile } from "../../enrichment/parser/file-validator";
import { extractResumeTextFromFile } from "../../enrichment/parser/text-extractor.service";
import { ApplicationError } from "../../../util/errors";

export class TaskController {
    public async create(
        request: FastifyRequest<{ Body: CreateTaskDTO }>,
        reply: FastifyReply
    ) {
        const taskService = getTaskService();
        const task = await taskService.createTask(request.body);

        return reply.status(201).send(task);
    }

    public async curate(
        request: FastifyRequest<{ Body: { job: JobCurationInput; cv: CVData } }>,
        reply: FastifyReply
    ) {
        const taskService = getTaskService();
        const task = await taskService.createCurationTask(request.body.job, request.body.cv);

        return reply.status(201).send(task);
    }

    public async parseResume(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            const uploadedFile = await request.file();

            if (!uploadedFile) {
                return reply.status(400).send({
                    error: "Nenhum arquivo foi enviado. Anexe um currículo em formato .pdf ou .txt."
                });
            }

            let buffer: Buffer;
            try {
                buffer = await uploadedFile.toBuffer();
            } catch (err: any) {
                if (err?.code === "FST_REQ_FILE_TOO_LARGE") {
                    return reply.status(413).send({
                        error: "O arquivo excede o tamanho máximo permitido de 5MB."
                    });
                }
                throw err;
            }

            const validatedFile = validateResumeFile({
                filename: uploadedFile.filename,
                mimetype: uploadedFile.mimetype,
                buffer,
                truncated: uploadedFile.file.truncated
            });

            const rawResumeText = await extractResumeTextFromFile(validatedFile);
            const taskService = getTaskService();
            const task = await taskService.createResumeParseTask(
                rawResumeText,
                validatedFile.sanitizedFilename
            );

            return reply.status(201).send(task);
        } catch (error: any) {
            if (error?.code === "FST_REQ_FILE_TOO_LARGE") {
                return reply.status(413).send({
                    error: "O arquivo excede o tamanho máximo permitido de 5MB."
                });
            }

            if (error instanceof ApplicationError) {
                const status = error.statusCode as 400 | 413 | 415 | 422 | 500;
                return reply.status(status).send({
                    error: error.message
                });
            }

            request.log.error(error, "Erro inesperado ao processar upload de currículo:");
            return reply.status(500).send({
                error: "Ocorreu um erro interno ao processar o arquivo enviado."
            });
        }
    }

    public async get(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const { id } = request.params;
        const taskService = getTaskService();
        const task = await taskService.getTask(id);

        if (!task) {
            return reply.status(404).send({
                error: "Task não encontrada."
            });
        }

        return reply.status(200).send(task);
    }
}
