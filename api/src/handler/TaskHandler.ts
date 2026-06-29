import { Job as BullJob } from "bullmq"

export interface TaskHandler {
    handle(job: BullJob): Promise<unknown>
}
