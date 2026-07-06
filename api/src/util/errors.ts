export class ApplicationError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 500
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class LinkedInScrapingError extends ApplicationError {
    constructor(message: string) {
        super(message, "LINKEDIN_SCRAPING_FAILED", 502);
    }
}

export class GeminiQuotaExhaustedError extends ApplicationError {
    constructor(message = "Limite de requisições do Gemini excedido (Quota Exhausted).") {
        super(message, "GEMINI_QUOTA_EXHAUSTED", 429);
    }
}

export class GeminiInvalidResponseError extends ApplicationError {
    constructor(message: string) {
        super(message, "GEMINI_INVALID_RESPONSE", 502);
    }
}

export class ConfigurationError extends ApplicationError {
    constructor(message: string) {
        super(message, "CONFIGURATION_ERROR", 500);
    }
}
