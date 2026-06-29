import pino from "pino"

export const loggerOptions = {
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    },
    level: 'debug'
}

const logger = pino(loggerOptions)

export default logger