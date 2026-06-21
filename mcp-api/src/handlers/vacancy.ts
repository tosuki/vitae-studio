import { BrowserCluster } from "../browser/browser";
import { Job } from "../model/job";
import { Handler } from "./handler"
import { InvalidJobStateError, BrowserExecutionError } from "../error/error"
import { Vacancy } from "../model/vacancy"
import { logger } from "../logger/logger"
import * as fs from "fs"
import * as path from "path"

/**
 * Processador responsável por navegar e extrair informações detalhadas de uma vaga de emprego.
 * Utiliza instâncias automatizadas de navegadores headless por meio do `BrowserCluster` (Puppeteer).
 * Carrega cookies de autenticação do LinkedIn a partir de `cookies.json` na raiz do projeto.
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
     * Executa a rotina de navegação e raspagem de dados de uma vaga específica do LinkedIn.
     * Carrega e injeta os cookies salvos para simular a sessão autenticada do usuário.
     * 
     * @param job A entidade de Job contendo a URL a ser acessada.
     * @param updateProgress Callback utilizado para reportar o avanço percentual da tarefa.
     * @returns A entidade de Job com as informações processadas ou atualizadas.
     * @throws InvalidJobStateError Caso o Job fornecido não possua o tipo correto ('details').
     * @throws BrowserExecutionError Caso ocorra alguma falha na leitura dos cookies ou no processo de scraping.
     */
    async handle(job: Job, updateProgress: (progress: number) => unknown): Promise<Job> {
        if (job.type !== "details") {
            throw new InvalidJobStateError("wrong job pickup")
        }

        const cookiesPath = path.resolve(process.cwd(), "cookies.json")
        logger.info(`[JobVacancyHandler] Carregando cookies do LinkedIn de: ${cookiesPath}`)
        
        let puppeteerCookies: any[] = []
        try {
            if (!fs.existsSync(cookiesPath)) {
                throw new BrowserExecutionError(`Arquivo de cookies não encontrado em: ${cookiesPath}`)
            }
            const cookiesContent = fs.readFileSync(cookiesPath, "utf-8")
            const cookies = JSON.parse(cookiesContent)
            
            puppeteerCookies = cookies.map((c: any) => {
                let sameSite: 'Strict' | 'Lax' | 'None' | undefined = undefined
                if (c.sameSite) {
                    const ss = c.sameSite.toLowerCase()
                    if (ss === 'no_restriction') sameSite = 'None'
                    else if (ss === 'lax') sameSite = 'Lax'
                    else if (ss === 'strict') sameSite = 'Strict'
                }
                
                return {
                    name: c.name,
                    value: c.value,
                    domain: c.domain,
                    path: c.path,
                    secure: c.secure,
                    httpOnly: c.httpOnly,
                    sameSite: sameSite,
                    expires: c.expirationDate ? Math.floor(c.expirationDate) : undefined
                }
            })
        } catch (error) {
            logger.error(`[JobVacancyHandler] Falha ao ler ou converter cookies:`, error)
            throw new BrowserExecutionError("Falha ao carregar e mapear cookies do LinkedIn", error)
        }

        let extractedVacancy: { name: string, company: string, description: string } | null = null

        await updateProgress(10)

        try {
            extractedVacancy = await this.browserCluster.execute(job.url, async ({ page, data: url }) => {
                logger.info(`[JobVacancyHandler] Configurando ${puppeteerCookies.length} cookies no navegador...`)
                await page.setCookie(...puppeteerCookies)

                logger.info(`[JobVacancyHandler] Navegando para a URL da vaga: ${url}`)
                await updateProgress(30)
                
                try {
                    await page.goto(url, {
                        waitUntil: "domcontentloaded",
                        timeout: 60000
                    })
                } catch (gotoError) {
                    logger.warn(`[JobVacancyHandler] Aviso de timeout/erro durante a navegação (domcontentloaded):`, gotoError)
                }

                logger.info(`[JobVacancyHandler] Aguardando 5 segundos para carregamento dinâmico da página...`)
                await updateProgress(50)
                await new Promise(r => setTimeout(r, 5000))

                logger.info(`[JobVacancyHandler] Extraindo dados de título, empresa e descrição do LinkedIn...`)
                await updateProgress(70)

                const extracted = await page.evaluate(() => {
                    // Seletores para o título da vaga
                    const title = document.querySelector('h1.t-24.t-bold')?.textContent?.trim() || 
                                  document.querySelector('.job-details-jobs-unified-top-card__title')?.textContent?.trim() || 
                                  document.querySelector('.jobs-unified-top-card__title')?.textContent?.trim() ||
                                  '';
                    
                    // Seletores para o nome da empresa
                    const company = document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.textContent?.trim() || 
                                    document.querySelector('.jobs-unified-top-card__company-name a')?.textContent?.trim() || 
                                    document.querySelector('.job-details-jobs-unified-top-card__primary-description-container a')?.textContent?.trim() || 
                                    '';
                    
                    // Seletores para a descrição da vaga
                    const description = document.querySelector('.jobs-description__content')?.textContent?.trim() || 
                                          document.querySelector('.jobs-description')?.textContent?.trim() || 
                                          '';

                    return { name: title, company, description }
                })

                logger.info(`[JobVacancyHandler] Extração concluída com sucesso. Título: "${extracted.name}", Empresa: "${extracted.company}", Tamanho da Descrição: ${extracted.description.length} caracteres.`)
                
                return extracted
            })
        } catch (error) {
            logger.error(`[JobVacancyHandler] Erro crítico ao executar tarefa de scraping no cluster:`, error)
            throw new BrowserExecutionError("Falha na execução do cluster do navegador Puppeteer", error)
        }

        if (!extractedVacancy || !extractedVacancy.name || !extractedVacancy.description) {
            logger.error(`[JobVacancyHandler] Falha ao extrair dados obrigatórios da vaga. Dados obtidos:`, extractedVacancy)
            throw new BrowserExecutionError("Falha ao extrair título ou descrição da vaga da página do LinkedIn")
        }

        const vacancy: Vacancy = {
            name: extractedVacancy.name,
            description: `${extractedVacancy.company ? `Empresa: ${extractedVacancy.company}\n\n` : ''}${extractedVacancy.description}`,
            requirements: [], // Requisitos vazios, serão analisados posteriormente pelo Gemini
            createdAt: Date.now(),
            createdBy: "system"
        }

        await updateProgress(100)

        return {
            ...job,
            vacancy
        }
    }
}