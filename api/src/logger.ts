import pino from "pino"

export const loggerTransportOptions = {
    target: 'pino-pretty',
    options: {
        colorize: true
    }
}

const logger = pino({ transport: loggerTransportOptions })

export default logger