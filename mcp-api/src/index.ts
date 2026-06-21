import "dotenv/config"
import app from "./http/server"
import { env } from "./env"
import { shutdownInstances } from "./factory"
import { logger } from "./logger/logger"

app.listen({
    port: Number(env.SERVER_PORT),
    host: env.SERVER_HOST
}, (error, address) => {
    if (error) {
        app.log.error(error)
        process.exit(1)
    }

    logger.info(app.printRoutes())
    logger.info(app.printPlugins())
    logger.info(`Listening on address ${address}`)
})

// Função para orquestrar o encerramento suave (graceful shutdown)
async function gracefulShutdown(signal: string) {
    logger.info(`Sinal ${signal} recebido. Iniciando encerramento suave...`)

    // Define um tempo limite de segurança (10s) para forçar o encerramento caso trave
    const forceExitTimeout = setTimeout(() => {
        logger.error("Encerramento suave expirou. Forçando saída...")
        process.exit(1)
    }, 10000)

    try {
        // 1. Para o servidor Fastify e para de aceitar novas requisições
        await app.close()
        logger.info("Servidor HTTP Fastify encerrado.")

        // 2. Fecha as conexões de infraestrutura pendentes (Redis, Workers, Puppeteer)
        await shutdownInstances()

        clearTimeout(forceExitTimeout)
        logger.info("Processo finalizado com sucesso.")
        process.exit(0)
    } catch (err) {
        logger.error(`Erro durante o encerramento suave: ${err instanceof Error ? err.message : String(err)}`)
        clearTimeout(forceExitTimeout)
        process.exit(1)
    }
}

// Captura sinais de encerramento do sistema operacional
process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))

