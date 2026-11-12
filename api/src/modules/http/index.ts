import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";
import router from "./router";
import env from "../../env";
import { loggerConfig } from "../../util/logger";
import { MAX_RESUME_FILE_SIZE_BYTES } from "../enrichment/parser/file-validator";

const start = async (): Promise<void> => {
    const fastify = Fastify({
        logger: loggerConfig
    });

    fastify.setValidatorCompiler(validatorCompiler);
    fastify.setSerializerCompiler(serializerCompiler);

    await fastify.register(cors, {
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    });

    await fastify.register(multipart, {
        limits: {
            fileSize: MAX_RESUME_FILE_SIZE_BYTES,
            files: 1
        }
    });

    await fastify.register(router);

    try {
        const address = await fastify.listen({ port: env.API_PORT, host: env.API_HOST });
        fastify.log.info(`Servidor HTTP executando no endereço: ${address}`);
    } catch (err) {
        fastify.log.error(err);
        throw err;
    }
};

export default { start };