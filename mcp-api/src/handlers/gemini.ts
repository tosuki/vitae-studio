import { Job } from "../model/job";
import { Handler } from "./handler"
import { GeminiAnalysisError } from "../error/error"

export class GeminiHandler implements Handler {
    handle(job: Job, updateProgress: (progress: number) => unknown): Promise<Job> | Job {
        throw new GeminiAnalysisError("Method not implemented.");
    }
}