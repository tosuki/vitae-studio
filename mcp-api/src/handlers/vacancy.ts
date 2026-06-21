import { BrowserCluster } from "../browser/browser";
import { Job } from "../model/job";
import { Handler } from "./handler"
import { InvalidJobStateError } from "../error/error"

/**
 * Processador responsável por navegar e extrair informações detalhadas de uma vaga de emprego.
 * Utiliza instâncias automatizadas de navegadores headless por meio do `BrowserCluster` (Puppeteer).
 * 
 * @example
 * ```typescript
 * const vacancyHandler = new JobVacancyHandler(browserCluster);
 * const updatedJob = await vacancyHandler.handle(job, (progresso) => {
 *     logger.info(`Progresso atual: ${progresso}%`);
 * });
 * ```
 */
export class JobVacancyHandler implements Handler {
    /**
     * Cria uma instância do processador de scraping de vagas.
     * @param browserCluster Cluster de navegadores Puppeteer para raspagem concorrente.
     */
    constructor(
        private browserCluster: BrowserCluster
    ) {}

    /**
     * Executa a rotina de navegação e raspagem de dados de uma vaga específica.
     * 
     * @param job A entidade de Job contendo a URL a ser acessada.
     * @param updateProgress Callback utilizado para reportar o avanço percentual da tarefa.
     * @returns A entidade de Job com as informações processadas ou atualizadas.
     * @throws InvalidJobStateError Caso o Job fornecido não possua o tipo correto ('details').
     */
    async handle(job: Job, updateProgress: (progress: number) => unknown): Promise<Job> {
        if (job.type !== "details") {
            throw new InvalidJobStateError("wrong job pickup")
        }

        await this.browserCluster.execute(job.url, async ({ page, data: url }) => {
            await page.goto(url)
        })

        return job
    }
}