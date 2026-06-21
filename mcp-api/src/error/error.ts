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

export class CoreError extends Error {
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

    isCritical(): boolean {
        return this.critical
    }

    static isInstanceOf<T extends Function>(error: unknown, instance: T): error is T {
        return error instanceof instance
    }
}

// --- Camada 1: Erros de API & HTTP ---
export class TaskNotFoundError extends CoreError {
    constructor(message: string = "Task not found", raw?: unknown) {
        super("TASK_NOT_FOUND", message, 404, false, raw)
    }
}

export class ValidationError extends CoreError {
    constructor(message: string = "Validation failed", raw?: unknown) {
        super("VALIDATION_FAILED", message, 400, false, raw)
    }
}

export class HttpInternalServerError extends CoreError {
    constructor(message: string = "Internal server error", raw?: unknown) {
        super("INTERNAL_SERVER_ERROR", message, 500, true, raw)
    }
}

// --- Camada 2: Erros de Fila & Worker ---
export class QueueJobFailedError extends CoreError {
    constructor(message: string, raw?: unknown) {
        super("QUEUE_JOB_FAILED", message, 500, true, raw)
    }
}

export class UnsupportedJobTypeError extends CoreError {
    constructor(message: string, raw?: unknown) {
        super("UNSUPPORTED_JOB_TYPE", message, 400, false, raw)
    }
}

// --- Camada 3: Erros de Negócio & Processadores (Handlers) ---
export class InvalidJobStateError extends CoreError {
    constructor(message: string, raw?: unknown) {
        super("INVALID_JOB_STATE", message, 422, false, raw)
    }
}

export class GeminiAnalysisError extends CoreError {
    constructor(message: string, raw?: unknown) {
        super("GEMINI_ANALYSIS_FAILED", message, 500, true, raw)
    }
}

// --- Camada 4: Erros de Infraestrutura & Navegador (Browser) ---
export class BrowserNotStartedError extends CoreError {
    constructor(message: string = "Browser cluster not started. Please call start() first.", raw?: unknown) {
        super("BROWSER_NOT_STARTED", message, 500, true, raw)
    }
}

export class BrowserExecutionError extends CoreError {
    constructor(message: string, raw?: unknown) {
        super("BROWSER_EXECUTION_FAILED", message, 500, false, raw)
    }
}

