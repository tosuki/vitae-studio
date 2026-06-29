export type TaskState =
    | { state: "running", result?: never, error?: never }
    | { state: "idle", result?: never, error?: never }
    | { state: "completed", result: unknown, error?: never }
    | { state: "error", result?: never }

export type TaskType =
    | { type: "gemini", prompt: string, url?: never }
    | { type: "linkedin_raw_text", url: string, prompt?: never }

export type Task = TaskState & TaskType
