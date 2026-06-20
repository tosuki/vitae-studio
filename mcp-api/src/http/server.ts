import Fastify from "fastify"

import cors from "@fastify/cors"
import router from "./router"
import error from "./error.handler"

const app = Fastify()

app.register(cors)
app.register(router.route, { prefix: "/api" })
app.setErrorHandler(error.handle)

export default app

