import "dotenv/config"
import app from "./http/server"

import { env } from "./env"

app.listen({
    port: env.SERVER_PORT,
    host: env.SERVER_HOST
}, (error, address) => {
    if (error) {
        return console.error(error)
    }

    console.log(app.printRoutes())
    console.log(app.printPlugins())
    console.log(`Listening on address ${address}`)
})
