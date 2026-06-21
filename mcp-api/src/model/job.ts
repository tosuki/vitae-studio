import { Vacancy } from "./vacancy"

export type JobType = 
    | { type: "details", url: string, vacancy?: never }
    | { type: "gemini", vacancy: Vacancy, url?: never }

export type JobState =
    | { state: "RUNNING", data?: never }
    | { state: "ERROR", data: unknown }
    | { state: "IDLE", data?: unknown }
    | { state: "COMPLETED", data: unknown }

export type Job = JobState & JobType & {
    id: string
    progress: number
    createdAt: number
    updatedAt: number
}
