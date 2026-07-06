export {};

declare global {
    type Result<ErrorType, DataType> = 
        | { err: ErrorType; data?: never }
        | { err?: never; data: DataType };
}
