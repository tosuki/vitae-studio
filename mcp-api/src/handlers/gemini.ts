import { Job } from "../model/job";
import { Handler } from "./handler"
import { GeminiAnalysisError } from "../error/error"

/**
 * Processador responsável pela otimização e análise inteligente de vagas utilizando inteligência artificial.
 * Envia dados estruturados para a API do Gemini e atualiza os resultados do Job.
 * 
 * @example
 * ```typescript
 * const geminiHandler = new GeminiHandler();
 * await geminiHandler.handle(job, (progresso) => {
 *     logger.info(`Progresso: ${progresso}%`);
 * });
 * ```
 */
export class GeminiHandler implements Handler {
    /**
     * Executa a análise semântica e otimização do perfil com base nos dados da vaga.
     * 
     * @param job A entidade de Job contendo os detalhes estruturados da vaga.
     * @param updateProgress Callback utilizado para reportar o avanço percentual da análise.
     * @returns A entidade de Job atualizada com as recomendações geradas pela IA.
     * @throws GeminiAnalysisError Caso ocorra um erro na comunicação ou processamento da API do Gemini.
     */
    handle(job: Job, updateProgress: (progress: number) => unknown): Promise<Job> | Job {
        throw new GeminiAnalysisError("Method not implemented.");
    }
}