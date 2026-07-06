import { Type, ApiError } from "@google/genai";
import { getGeminiClient } from "../factory";
import {
    GeminiQuotaExhaustedError,
    GeminiInvalidResponseError,
    ConfigurationError
} from "../../../util/errors";
import env from "../../../env";

export interface ResumePersonal {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
}

export interface ResumeExperience {
    id: string;
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface ResumeEducation {
    id: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface ResumeCertificate {
    id: string;
    name: string;
    organization: string;
    date: string;
}

export interface ResumeLanguage {
    id: string;
    name: string;
    level: string;
}

export interface ResumeStyle {
    theme: string;
    fontFamily: string;
    accentColor: string;
    spacing: string;
}

export interface ExtractedResume {
    personal: ResumePersonal;
    objective: string;
    experience: ResumeExperience[];
    education: ResumeEducation[];
    certificates: ResumeCertificate[];
    skills: string[];
    languages: ResumeLanguage[];
    style: ResumeStyle;
}

export async function extractJobInfoWithGemini(
    rawHtml: string
): Promise<Result<GeminiQuotaExhaustedError | GeminiInvalidResponseError | ConfigurationError, ExtractedResume>> {
    if (!env.GEMINI_API_KEY) {
        return { err: new ConfigurationError("GEMINI_API_KEY não foi configurada nas variáveis de ambiente.") };
    }

    try {
        const ai = getGeminiClient();

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                personal: {
                    type: Type.OBJECT,
                    properties: {
                        fullName: { type: Type.STRING },
                        title: { type: Type.STRING },
                        email: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        location: { type: Type.STRING },
                        linkedin: { type: Type.STRING },
                        github: { type: Type.STRING },
                    },
                    required: ["fullName", "title", "email", "phone", "location", "linkedin", "github"]
                },
                objective: { type: Type.STRING },
                experience: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            company: { type: Type.STRING },
                            role: { type: Type.STRING },
                            location: { type: Type.STRING },
                            startDate: { type: Type.STRING },
                            endDate: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["id", "company", "role", "location", "startDate", "endDate", "description"]
                    }
                },
                education: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            institution: { type: Type.STRING },
                            degree: { type: Type.STRING },
                            startDate: { type: Type.STRING },
                            endDate: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["id", "institution", "degree", "startDate", "endDate", "description"]
                    }
                },
                certificates: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            organization: { type: Type.STRING },
                            date: { type: Type.STRING }
                        },
                        required: ["id", "name", "organization", "date"]
                    }
                },
                skills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                languages: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            level: { type: Type.STRING }
                        },
                        required: ["id", "name", "level"]
                    }
                },
                style: {
                    type: Type.OBJECT,
                    properties: {
                        theme: { type: Type.STRING },
                        fontFamily: { type: Type.STRING },
                        accentColor: { type: Type.STRING },
                        spacing: { type: Type.STRING }
                    },
                    required: ["theme", "fontFamily", "accentColor", "spacing"]
                }
            },
            required: ["personal", "objective", "experience", "education", "certificates", "skills", "languages", "style"]
        };
        6
        const prompt: string = `
Você é um especialista em recrutamento e análise de currículos.
Analise os dados brutos de texto ou HTML fornecidos de uma vaga de emprego ou de um perfil profissional e extraia as informações estruturadas.
Preencha a estrutura de dados fornecida de maneira detalhada e precisa.

Instruções importantes:
1. Extraia o nome do profissional (caso haja) ou preencha com dados relevantes extraídos. Se for uma vaga, preencha os dados da pessoa fictícia/vaga de forma condizente ou deixe em branco caso não aplicável, mas sempre retorne a estrutura completa do JSON.
2. Nas listas (experience, education, certificates, languages), você DEVE gerar um ID único para cada item no formato correspondente:
   - Para experiência: 'exp-<número_único>' (ex: exp-1781980903391)
   - Para educação: 'edu-<número_único>' (ex: edu-1781981773299)
   - Para certificados: 'cert-<número_único>' (ex: cert-1781981945824)
   - Para idiomas: use IDs sequenciais indexados em 1 (ex: 'lang-1', 'lang-2', 'lang-3')
3. Todas as datas (startDate, endDate, date) de experiência, educação e certificados devem obrigatoriamente estar no formato de string 'MM/AAAA' (ex: '02/2026'). Não use 'AAAA-MM-DD' ou outros formatos. Caso a data esteja incompleta ou seja apenas o ano, tente inferir o mês ou deixe como string vazia se não for possível, mas sempre no formato 'MM/AAAA' ou ''.
4. Os links de 'linkedin' e 'github' na seção 'personal' não devem conter protocolo ('https://' ou 'http://'). Devem começar diretamente com o domínio (ex: 'linkedin.com/in/nome' em vez de 'https://linkedin.com/in/nome', e 'github.com/usuario' em vez de 'https://github.com/usuario').
5. Na seção "style", forneça sugestões de estilização estética condizentes com a vaga (ex: theme = 'modern', fontFamily = 'roboto' ou 'inter', accentColor = '#374151', spacing = 'compact' ou 'normal').
6. A data final (endDate) de experiências ou estudos que ainda estão em andamento deve ser retornada como string vazia "".
7. Retorne estritamente o JSON estruturado seguindo o schema fornecido. Não adicione markdown adicional de tags, apenas o JSON.

DADOS BRUTOS:
${rawHtml}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });

        if (!response.text) {
            return { err: new GeminiInvalidResponseError("Não foi possível obter resposta em texto do Gemini.") };
        }

        const parsedData: ExtractedResume = JSON.parse(response.text);
        return { data: parsedData };

    } catch (error: any) {
        if (error instanceof ApiError && error.status === 429) {
            return { err: new GeminiQuotaExhaustedError() };
        }

        return { err: new GeminiInvalidResponseError(error.message || "Erro desconhecido na integração com o Gemini") };
    }
}
