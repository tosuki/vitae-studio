import { Cluster } from "puppeteer-cluster"
import { LaunchOptions } from "puppeteer"

import PuppeteerExtra from "puppeteer-extra"
import logger from "../logger"

import StealthMode from "puppeteer-extra-plugin-stealth"


PuppeteerExtra.use(StealthMode())

export type BrowserClusterOptions = {

}

export class BrowserCluster {
    private cluster: Cluster | null = null
    private options: LaunchOptions

    constructor(options: LaunchOptions) {
        this.options = options
    }

    async getCluster(): Promise<Cluster> {
        if (this.cluster === null) {
            await this.start(this.options)
        }

        return this.cluster!
    }

    async start(options: LaunchOptions | null = null) {
        if (this.cluster === null) {
            if (options)
                this.options = options

            this.cluster = await Cluster.launch({
                puppeteer: PuppeteerExtra,
                puppeteerOptions: options ?? this.options,
                maxConcurrency: 2,
                concurrency: Cluster.CONCURRENCY_PAGE
            })
        }

        logger.warn("Tentativa de inicializar o cluster do Puppeteer. No entanto, ele já se encontra inicializado.")
    }

    async close() {
        if (this.cluster === null)
            return

        await this.close()
    }
}