import logger from "./logger"
import server from "./http/server"

server.start()
    .catch((error) => {
        logger.error(error)
    })
