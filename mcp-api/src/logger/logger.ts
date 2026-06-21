/**
 * Tabela de códigos ANSI para estilização e colorização das saídas de log no terminal.
 */
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

/**
 * Utilitário de registro de logs centralizado e colorido.
 * Formata os logs do sistema com timestamps, severidades coloridas e suporta parâmetros adicionais.
 * 
 * @example
 * ```typescript
 * logger.info("Servidor escutando na porta 3000");
 * logger.error("Conexão interrompida com o banco de dados", err);
 * ```
 */
class CentralizedLogger {
    /**
     * Obtém o carimbo de data/hora formatado em padrão ISO.
     * @returns Data/hora atual formatada.
     */
    private getTimestamp(): string {
        return new Date().toISOString()
    }

    /**
     * Formata a mensagem com cores ANSI de acordo com o nível de log.
     * @param level O nível de severidade do log (ex: INFO, DEBUG).
     * @param color O código ANSI correspondente à cor da severidade.
     * @param message A mensagem principal a ser logada.
     * @returns Mensagem de log totalmente formatada e colorida.
     */
    private format(level: string, color: string, message: string): string {
        return `${ANSI_COLORS.gray}[${this.getTimestamp()}]${ANSI_COLORS.reset} ${color}${ANSI_COLORS.bold}[${level}]${ANSI_COLORS.reset} ${message}`
    }

    /**
     * Registra informações destinadas à depuração (utilitário console.debug).
     * @param message Mensagem de texto a ser logada.
     * @param args Parâmetros técnicos opcionais.
     */
    debug(message: string, ...args: unknown[]) {
        console.debug(this.format("DEBUG", ANSI_COLORS.cyan, message), ...args)
    }

    /**
     * Registra logs informativos do fluxo padrão (utilitário console.info).
     * @param message Mensagem de texto a ser logada.
     * @param args Parâmetros adicionais opcionais.
     */
    info(message: string, ...args: unknown[]) {
        console.info(this.format("INFO", ANSI_COLORS.green, message), ...args)
    }

    /**
     * Registra avisos de atenção ou comportamentos inesperados (utilitário console.warn).
     * @param message Mensagem de texto a ser logada.
     * @param args Parâmetros adicionais opcionais.
     */
    warn(message: string, ...args: unknown[]) {
        console.warn(this.format("WARN", ANSI_COLORS.yellow, message), ...args)
    }

    /**
     * Registra erros e falhas recuperáveis do sistema (utilitário console.error).
     * @param message Mensagem de texto a ser logada.
     * @param args Parâmetros adicionais opcionais (ex: Stacktrace do erro).
     */
    error(message: string, ...args: unknown[]) {
        console.error(this.format("ERROR", ANSI_COLORS.red, message), ...args)
    }

    /**
     * Registra incidentes catastróficos que impedem o funcionamento de um recurso chave (utilitário console.error).
     * @param message Mensagem de texto a ser logada.
     * @param args Parâmetros adicionais de erros críticos.
     */
    critical(message: string, ...args: unknown[]) {
        console.error(this.format("CRITICAL", ANSI_COLORS.magenta, message), ...args)
    }
}

/**
 * Instância exportada e compartilhada do logger centralizado do sistema.
 */
export const logger = new CentralizedLogger()
