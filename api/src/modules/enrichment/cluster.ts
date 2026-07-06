import PuppeteerExtra from "puppeteer-extra"
import PuppeteerStealthMode from "puppeteer-extra-plugin-stealth"

import { Cluster } from "puppeteer-cluster"
import { LaunchOptions } from "puppeteer"

export type BrowserClusterOptions = LaunchOptions

export class ClusterHolder {
    private cluster: Cluster | null = null
    private options: LaunchOptions

    constructor(options: LaunchOptions = {}) {
        this.options = options
    }

    async start() {
        if (this.cluster !== null) {
            throw new Error("O Cluster já se encontra inicializado.")
        }

        this.cluster = await Cluster.launch({
            puppeteer: PuppeteerExtra,
            puppeteerOptions: this.options
        })
    }

    public getCluster(): Cluster {
        if (this.cluster === null)
            throw new Error("Cluster deve ser inicializado anteriormente.")

        return this.cluster
    }

    public async close() {
        if (this.cluster !== null) {
            await this.cluster.close()
            this.cluster = null
        }
    }
}