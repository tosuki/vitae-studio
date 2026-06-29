import Fastify from "fastify"

import cors from "@fastify/cors"
import router from "./router"
import environment from "../env"

import { loggerOptions } from "../logger"

const start = async () => {
    const fastify = Fastify({
        logger: loggerOptions
    })

    await fastify.register(cors)
    await fastify.register(router)

    fastify.log.debug(`\n${fastify.printPlugins()}`)
    fastify.log.debug(`\n${fastify.printRoutes()}`)

    await fastify.listen({
        host: environment.API_HOST,
        port: environment.API_PORT
    })
}


export default { start }