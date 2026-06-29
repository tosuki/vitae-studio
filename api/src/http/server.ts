import Fastify from "fastify"

import cors from "@fastify/cors"
import router from "./router"
import environment from "../env"

import { loggerTransportOptions } from "../logger"

const start = async () => {
    const fastify = Fastify({
        logger: {
            transport: loggerTransportOptions
        }
    })

    await fastify.register(cors)
    await fastify.register(router)

    await fastify.listen({
        host: environment.API_HOST,
        port: environment.API_PORT
    })
}


export default { start }