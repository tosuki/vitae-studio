const ANSI_COLORS = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    gray: "\x1b[90m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
}

class CentralizedLogger {
    // Obtém o carimbo de data/hora formatado
    private getTimestamp(): string {
        return new Date().toISOString()
    }

    // Formata a mensagem com cores ANSI de acordo com o nível de log
    private format(level: string, color: string, message: string): string {
        return `${ANSI_COLORS.gray}[${this.getTimestamp()}]${ANSI_COLORS.reset} ${color}${ANSI_COLORS.bold}[${level}]${ANSI_COLORS.reset} ${message}`
    }

    debug(message: string, ...args: unknown[]) {
        console.debug(this.format("DEBUG", ANSI_COLORS.cyan, message), ...args)
    }

    info(message: string, ...args: unknown[]) {
        console.info(this.format("INFO", ANSI_COLORS.green, message), ...args)
    }

    warn(message: string, ...args: unknown[]) {
        console.warn(this.format("WARN", ANSI_COLORS.yellow, message), ...args)
    }

    error(message: string, ...args: unknown[]) {
        console.error(this.format("ERROR", ANSI_COLORS.red, message), ...args)
    }

    critical(message: string, ...args: unknown[]) {
        console.error(this.format("CRITICAL", ANSI_COLORS.magenta, message), ...args)
    }
}

export const logger = new CentralizedLogger()
