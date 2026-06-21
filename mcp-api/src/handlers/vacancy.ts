import { BrowserCluster } from "../browser/browser";
import { Job } from "../model/job";
import { Handler } from "./handler"
import { InvalidJobStateError } from "../error/error"

export class JobVacancyHandler implements Handler {
    constructor(
        private browserCluster: BrowserCluster
    ) {}

    async handle(job: Job, updateProgress: (progress: number) => unknown): Promise<Job> {
        if (job.type !== "details") {
            throw new InvalidJobStateError("wrong job pickup")
        }

        const result = await this.browserCluster.execute(job.url, async ({ page,  data: url }) => {
            await page.goto(url)
            
        })

        return job
    }
}