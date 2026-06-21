/**
 * Lista de códigos de erro padronizados do sistema.
 * Garante que não ocorram erros de digitação ao reportar falhas entre diferentes camadas.
 */
export type ErrorCode =
    | "TASK_NOT_FOUND"
    | "VALIDATION_FAILED"
    | "INTERNAL_SERVER_ERROR"
    | "QUEUE_JOB_FAILED"
    | "UNSUPPORTED_JOB_TYPE"
    | "INVALID_JOB_STATE"
    | "GEMINI_ANALYSIS_FAILED"
    | "BROWSER_NOT_STARTED"
    | "BROWSER_EXECUTION_FAILED"

/**
 * Classe base para exceções customizadas da aplicação.
 * Encapsula informações necessárias para telemetria, criticidade e respostas de APIs.
 * 
 * @example
 * ```typescript
 * throw new CoreError("VALIDATION_FAILED", "O campo URL é obrigatório", 400);
 * ```
 */
export class CoreError extends Error {
    /**
     * Cria uma instância de CoreError.
     * @param code Código do erro padronizado.
     * @param message Mensagem de texto descritiva do erro.
     * @param statusCode Código de status HTTP sugerido (default 500).
     * @param critical Indica se o erro é crítico e requer alerta imediato (default false).
     * @param raw Detalhes técnicos adicionais sobre a causa raiz (ex: erro original).
     */
    constructor(
        public readonly code: ErrorCode,
        public override readonly message: string,
        public readonly statusCode: number = 500,
        private readonly critical: boolean = false,
        public readonly raw: unknown = undefined
    ) {
        super(message)
        this.name = this.constructor.name
        Object.setPrototypeOf(this, new.target.prototype)
    }

    /**
     * Retorna se a exceção representa uma falha crítica que exige atenção de monitoramento.
     * 
     * @example
     * ```typescript
     * if (error.isCritical()) {
     *     logger.critical("Erro fatal detectado!");
     * }
     * ```
     */
    isCritical(): boolean {
        return this.critical
    }

    /**
     * Verifica de forma segura se um erro genérico é instância de uma classe específica.
     * 
     * @example
     * ```typescript
     * if (CoreError.isInstanceOf(error, TaskNotFoundError)) {
     *     // error agora é tipado como TaskNotFoundError
     * }
     * ```
     */
    static isInstanceOf<T extends Function>(error: unknown, instance: T): error is T {
        return error instanceof instance
    }
}

// --- Camada 1: Erros de API & HTTP ---

/**
 * Exceção disparada quando um recurso ou tarefa solicitada não é encontrada.
 * Retorna status HTTP 404 por padrão.
 * 
 * @example
 * ```typescript
 * throw new TaskNotFoundError("A tarefa com ID 123 não existe no banco de dados");
 * ```
 */
export class TaskNotFoundError extends CoreError {
    constructor(message: string = "Task not found", raw?: unknown) {
        super("TASK_NOT_FOUND", message, 404, false, raw)
    }
}

/**
 * Exceção disparada quando o payload recebido nas rotas não atende às regras de validação.
 * Retorna status HTTP 400 por padrão.
 * 
 * @example
 * ```typescript
 * throw new ValidationError("A URL fornecida é inválida", zodIssues);
 * ```
 */
export class ValidationError extends CoreError {
    constructor(message: string = "Validation failed", raw?: unknown) {
        super("VALIDATION_FAILED", message, 400, false, raw)
    }
}

/**
 * Exceção genérica para erros internos do servidor.
 * Retorna status HTTP 500 por padrão e é sinalizada como crítica.
 * 
 * @example
 * ```typescript
 * throw new HttpInternalServerError("Conexão perdida com o servidor principal", error);
 * ```
 */
export class HttpInternalServerError extends CoreError {
    constructor(message: string = "Internal server error", raw?: unknown) {
        super("INTERNAL_SERVER_ERROR", message, 500, true, raw)
    }
}

// --- Camada 2: Erros de Fila & Worker ---

/**
 * Exceção disparada quando a execução de uma tarefa agendada na fila de tarefas (BullMQ) falha.
 * É considerada uma falha crítica.
 * 
 * @example
 * ```typescript
 * throw new QueueJobFailedError("Ocorreu uma falha no processamento do Job no Redis", originalError);
 * ```
 */
export class QueueJobFailedError extends CoreError {
    constructor(message: string, raw?: unknown) {
        super("QUEUE_JOB_FAILED", message, 500, true, raw)
    }
}

/**
 * Exceção disparada ao tentar processar ou agendar um tipo de Job inexistente ou sem suporte.
 * Retorna status HTTP 400 por padrão.
 * 
 * @example
 * ```typescript
 * throw new UnsupportedJobTypeError("Tipo de Job 'outros' não é suportado pelo worker");
 * ```
 */
export class UnsupportedJobTypeError extends CoreError {
    constructor(message: string, raw?: unknown) {
        super("UNSUPPORTED_JOB_TYPE", message, 400, false, raw)
    }
}

// --- Camada 3: Erros de Negócio & Processadores (Handlers) ---

/**
 * Exceção disparada quando um Job está em um estado incompatível para a operação solicitada.
 * Retorna status HTTP 422 (Unprocessable Entity) por padrão.
 * 
 * @example
 * ```typescript
 * throw new InvalidJobStateError("O job precisa estar em estado IDLE para ser iniciado");
 * ```
 */
export class InvalidJobStateError extends CoreError {
    constructor(message: string, raw?: unknown) {
        super("INVALID_JOB_STATE", message, 422, false, raw)
    }
}

/**
 * Exceção disparada ao ocorrer uma falha na interação ou análise da API da IA (Gemini).
 * É considerada uma falha crítica.
 * 
 * @example
 * ```typescript
 * throw new GeminiAnalysisError("Falha na chamada à API do Gemini devido ao limite de cota atingido");
 * ```
 */
export class GeminiAnalysisError extends CoreError {
    constructor(message: string, raw?: unknown) {
        super("GEMINI_ANALYSIS_FAILED", message, 500, true, raw)
    }
}

// --- Camada 4: Erros de Infraestrutura & Navegador (Browser) ---

/**
 * Exceção disparada ao tentar executar comandos no navegador sem antes iniciar o cluster.
 * É considerada uma falha crítica.
 * 
 * @example
 * ```typescript
 * throw new BrowserNotStartedError();
 * ```
 */
export class BrowserNotStartedError extends CoreError {
    constructor(message: string = "Browser cluster not started. Please call start() first.", raw?: unknown) {
        super("BROWSER_NOT_STARTED", message, 500, true, raw)
    }
}

/**
 * Exceção disparada quando ocorre uma falha catastrófica durante a navegação/scraping de uma página.
 * Retorna status HTTP 500 por padrão.
 * 
 * @example
 * ```typescript
 * throw new BrowserExecutionError("Timeout ao carregar a página de vaga", error);
 * ```
 */
export class BrowserExecutionError extends CoreError {
    constructor(message: string, raw?: unknown) {
        super("BROWSER_EXECUTION_FAILED", message, 500, false, raw)
    }
}
