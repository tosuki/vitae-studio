import { getClusterInstance } from "../factory";
import { LinkedInScrapingError } from "../../../util/errors";

export const getLinkedinJobRawDetails = async (code: string): Promise<Result<LinkedInScrapingError, string>> => {
    try {
        const cluster = await getClusterInstance();

        const outerHtml = await cluster.execute(code, async ({ page, data: linkedinJobCode }) => {
            await page.goto(`https://www.linkedin.com/jobs/view/${linkedinJobCode}/`, {
                waitUntil: "domcontentloaded",
                timeout: 30000
            });

            const linkedinJobSection = await page.$('main section');
            if (!linkedinJobSection) {
                throw new Error("Não foi possível encontrar a seção com os dados da vaga");
            }

            const html = await linkedinJobSection.evaluate((el) => el.outerHTML);
            return html;
        });

        return { data: outerHtml };
    } catch (error: any) {
        return { err: new LinkedInScrapingError(error.message || "Falha desconhecida no Scraper do LinkedIn") };
    }
};