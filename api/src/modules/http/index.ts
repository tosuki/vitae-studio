import Fastify from "fastify";
import cors from "@fastify/cors";
import { validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";
import router from "./router";
import env from "../../env";
import { loggerConfig } from "../../util/logger";

const start = async (): Promise<void> => {
    const fastify = Fastify({
        logger: loggerConfig
    });

    fastify.setValidatorCompiler(validatorCompiler);
    fastify.setSerializerCompiler(serializerCompiler);

    await fastify.register(cors);
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