import { Job } from "../model/job";

export interface Handler {
    handle(job: Job, updateProgress: (progress: number) => unknown): Promise<Job> | Job
}