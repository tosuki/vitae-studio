import { Job } from "bullmq"
import { TaskHandler } from "./TaskHandler"

export class LinkedinRawTextHandler implements TaskHandler {
    async handle(job: Job): Promise<unknown> {
        return 2;
    }
}