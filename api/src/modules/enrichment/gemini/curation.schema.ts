import { Type } from "@google/genai";

export const CurationResponseSchema = {
    type: Type.OBJECT,
    properties: {
        matchScore: {
            type: Type.INTEGER,
            description: "Score de aderência ATS calculado de 0 a 100"
        },
        matchedKeywords: {
            type: Type.ARRAY,
            description: "Palavras-chave da vaga encontradas no histórico do candidato",
            items: { type: Type.STRING }
        },
        missingKeywords: {
            type: Type.ARRAY,
            description: "Requisitos ou palavras-chave importantes da vaga não identificados no perfil",
            items: { type: Type.STRING }
        },
        tailoredObjective: {
            type: Type.STRING,
            description: "Resumo profissional/objetivo ultra direcionado para a vaga em 2 a 3 frases"
        },
        experienceCuration: {
            type: Type.ARRAY,
            description: "Curadoria de cada experiência do perfil mestre",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: {
                        type: Type.STRING,
                        description: "ID original da experiência"
                    },
                    included: {
                        type: Type.BOOLEAN,
                        description: "True se o item deve ser exibido na 1 folha A4 (máximo 2 a 3 experiências)"
                    },
                    relevanceScore: {
                        type: Type.INTEGER,
                        description: "Afinidade de 0 a 100 com o cargo desejado"
                    },
                    tailoredDescription: {
                        type: Type.STRING,
                        description: "Versão condensada em 2-3 bullets com verbos de ação e palavras-chave da vaga"
                    }
                },
                required: ["id", "included", "relevanceScore", "tailoredDescription"]
            }
        },
        projectCuration: {
            type: Type.ARRAY,
            description: "Curadoria dos projetos do portfólio",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: {
                        type: Type.STRING,
                        description: "ID original do projeto"
                    },
                    included: {
                        type: Type.BOOLEAN,
                        description: "True se deve ser exibido na 1 folha A4 (máximo 1 a 2 projetos)"
                    },
                    relevanceScore: {
                        type: Type.INTEGER,
                        description: "Afinidade de 0 a 100 com o cargo desejado"
                    },
                    tailoredDescription: {
                        type: Type.STRING,
                        description: "Descrição concisa destacando as tecnologias relevantes"
                    }
                },
                required: ["id", "included", "relevanceScore", "tailoredDescription"]
            }
        },
        educationCuration: {
            type: Type.ARRAY,
            description: "Curadoria da formação acadêmica",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: {
                        type: Type.STRING,
                        description: "ID original da formação"
                    },
                    included: {
                        type: Type.BOOLEAN,
                        description: "True se deve ser exibido"
                    },
                    relevanceScore: {
                        type: Type.INTEGER,
                        description: "Afinidade com a vaga"
                    }
                },
                required: ["id", "included", "relevanceScore"]
            }
        },
        certificateCuration: {
            type: Type.ARRAY,
            description: "Curadoria de certificados",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: {
                        type: Type.STRING,
                        description: "ID original do certificado"
                    },
                    included: {
                        type: Type.BOOLEAN,
                        description: "True se deve ser exibido"
                    },
                    relevanceScore: {
                        type: Type.INTEGER,
                        description: "Afinidade com a vaga"
                    }
                },
                required: ["id", "included", "relevanceScore"]
            }
        },
        selectedSkills: {
            type: Type.ARRAY,
            description: "Lista de 8 a 12 competências do candidato prioritárias para a vaga",
            items: { type: Type.STRING }
        }
    },
    required: [
        "matchScore",
        "matchedKeywords",
        "missingKeywords",
        "tailoredObjective",
        "experienceCuration",
        "projectCuration",
        "educationCuration",
        "certificateCuration",
        "selectedSkills"
    ]
};
