import { Job } from "../model/job";
import { Handler } from "./handler"

export class JobVacancyHandler implements Handler {
    handle(job: Job, updateProgress: (progress: number) => unknown): Promise<Job> | Job {
        throw new Error("Method not implemented.");
    }
}