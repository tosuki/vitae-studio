import httpServer from "./modules/http";
import { getQueueManager, shutdownAll } from "./modules/enrichment/factory";
import { logger } from "./util/logger";

const main = async (): Promise<void> => {
    try {
        const queueManager = getQueueManager();
        queueManager.startWorkers();
        logger.info("Workers do BullMQ inicializados com sucesso.");

        await httpServer.start();

    } catch (error: any) {
        logger.error(error, "Falha ao inicializar a aplicação:");
        await shutdownAll();
        process.exit(1);
    }
};

const handleShutdown = async (signal: string): Promise<void> => {
    logger.info(`Recebido sinal de encerramento ${signal}. Finalizando recursos...`);
    await shutdownAll();
    logger.info("Todos os recursos foram limpos. Encerrando processo.");
    process.exit(0);
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

main();