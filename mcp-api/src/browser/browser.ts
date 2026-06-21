import { LaunchOptions } from "puppeteer"
import { Cluster, TaskFunction } from "puppeteer-cluster"

import PuppeteerExtra from "puppeteer-extra"
import StealthMode from "puppeteer-extra-plugin-stealth"
import { BrowserNotStartedError } from "../error/error"

export type BrowserClusterConfiguration = { 
    launch?: LaunchOptions
    maxConcurrency?: number
    concurrency?: number
}

/**
 * Gerencia o ciclo de vida e a execução de tarefas concorrentes em instâncias do Chrome Headless
 * utilizando o Puppeteer Cluster integrado ao plugin Stealth.
 * 
 * @example
 * ```typescript
 * const browserCluster = new BrowserCluster({
 *     maxConcurrency: 2,
 *     concurrency: Cluster.CONCURRENCY_CONTEXT
 * });
 * 
 * await browserCluster.start();
 * 
 * const title = await browserCluster.execute("https://google.com", async ({ page, data: url }) => {
 *     await page.goto(url);
 *     return await page.title();
 * });
 * 
 * console.log(title);
 * await browserCluster.close();
 * ```
 */
export class BrowserCluster {
    private cluster: Cluster | null = null
    private opts: BrowserClusterConfiguration

    constructor(opts: BrowserClusterConfiguration = {
        launch: {
            headless: false
        }
    }) {
        this.opts = opts
    }

    /**
     * Inicializa a instância do Puppeteer Cluster com o plugin Stealth ativado.
     * Deve ser invocado antes de executar qualquer tarefa.
     * 
     * @example
     * ```typescript
     * const cluster = new BrowserCluster();
     * await cluster.start();
     * ```
     */
    async start() {
        if (this.cluster !== null)
            return
        
        // Registra o plugin Stealth para evitar bloqueios anti-bot
        PuppeteerExtra.use(StealthMode())
        
        this.cluster = await Cluster.launch({
            maxConcurrency: this.opts.maxConcurrency ?? 1,
            concurrency: this.opts.concurrency ?? Cluster.CONCURRENCY_PAGE,
            puppeteer: PuppeteerExtra as any,
            puppeteerOptions: this.opts.launch
        })
    }

    /**
     * Executa uma tarefa ad-hoc de navegação/extração em uma aba/contexto livre do cluster.
     * 
     * @template TData Tipo dos dados de entrada passados para a tarefa (ex: URL ou objeto)
     * @template TReturn Tipo do retorno gerado pela execução do callback de raspagem
     * 
     * @param data Dado de entrada necessário para a execução do job (ex: URL a ser acessada)
     * @param task Callback contendo as interações do Puppeteer que extraem os dados
     * 
     * @example
     * ```typescript
     * const html = await cluster.execute("https://example.com", async ({ page, data: url }) => {
     *     await page.goto(url);
     *     return await page.content();
     * });
     * ```
     */
    async execute<TData = any, TReturn = any>(
        data: TData, 
        task?: TaskFunction<TData, TReturn>
    ): Promise<TReturn> {
        if (this.cluster === null) {
            throw new BrowserNotStartedError()
        }
        
        return this.cluster.execute(data, task) as Promise<TReturn>
    }

    /**
     * Aguarda as tarefas ativas terminarem e encerra o cluster liberando a memória RAM.
     * 
     * @example
     * ```typescript
     * await cluster.close();
     * ```
     */
    async close() {
        if (this.cluster === null)
            return

        await this.cluster.idle()
        await this.cluster.close()
        this.cluster = null
    }

    /**
     * Retorna a instância nativa do Puppeteer Cluster subjacente.
     * Útil se precisar registrar callbacks padrão como `cluster.task()`.
     * 
     * @example
     * ```typescript
     * const rawCluster = cluster.getClusterInstance();
     * rawCluster.on('taskerror', (err, data) => { ... });
     * ```
     */
    getClusterInstance(): Cluster | null {
        return this.cluster
    }
}