import { Type } from "@google/genai"

export const PersonalDataResponseSchema = {
    type: Type.OBJECT,
    properties: {
        fullName: {
            type: Type.STRING,
            description: "Nome do profissional"
        },
        title: {
            type: Type.STRING,
            description: "Profissão/cargo. Exemplo: Desenvolvedor Fullstack"
        },
        email: {
            type: Type.STRING,
            description: "Email do profissional"
        },
        phone: {
            type: Type.STRING,
            description: "Número de telefone"
        },
        location: {
            type: Type.STRING,
            description: "Local de moradia, deve ser colocado uma informação breve, como Belo Horizonte, MG"
        },
        linkedin: {
            type: Type.STRING,
            description: "Link pro linkedin do profissional"
        },
        github: {
            type: Type.STRING,
            description: "Link pro github",
        }
    },
    required: ["fullName", "title", "email", "phone", "location", "linkedin", "github"]
}

export const ExperienceItemResponseSchema = {
    type: Type.ARRAY,
    description: "Experiencias do profissional",
    items: {
        type: Type.OBJECT,
        properties: {
            id: {
                type: Type.STRING,
                description: "Copie exatamente o ID recebido no currículo original para este item"
            },
            company: {
                type: Type.STRING,
                description: "O nome da empresa que o profissional trabalhou"
            },
            role: {
                type: Type.STRING,
                description: "O nome do cargo que o profissional ocupou nessa empresa"
            },
            location: {
                type: Type.STRING,
                description: "O local da experiencia"
            },
            startDate: {
                type: Type.STRING,
                description: "Data mês/ano do inicio da experiencia"
            },
            endDate: {
                type: Type.STRING,
                description: "Data mês/ano do fim da experiencia. Em caso de ser a experiência atual, retornar uma string vazia"
            },
            description: {
                type: Type.STRING,
                description: "Descrição da experiência. O que foi feito e etc...",
            }
        },
        required: ["id", "company", "role", "location", "startDate", "endDate", "description"]
    }
}

export const EducationItemResponseSchema = {
    type: Type.ARRAY,
    description: "Graduações",
    items: {
        type: Type.OBJECT,
        properties: {
            id: {
                type: Type.STRING,
                description: "Copie exatamente o ID recebido no currículo original para este item"
            },
            institution: {
                type: Type.STRING,
                description: "Nome da Instituição",
            },
            degree: {
                type: Type.STRING,
                description: "Nome do curso"
            },
            startDate: {
                type: Type.STRING,
                description: "Inicio da graduação."
            },
            endDate: {
                type: Type.STRING,
                description: "Fim da graduação."
            },
            description: {
                type: Type.STRING,
                description: "As coisas que foram feitas durante a graduação"
            }
        },
        required: ["id", "institution", "degree", "startDate", "endDate", "description"]
    }
}

export const CertificateItemResponseSchema = {
    type: Type.ARRAY,
    description: "Certificados",
    items: {
        type: Type.OBJECT,
        properties: {
            id: {
                type: Type.STRING,
                description: "Copie exatamente o ID recebido no currículo original para este item"
            },
            name: {
                type: Type.STRING,
                description: "Nome do certificado"
            },
            organization: {
                type: Type.STRING,
                description: "Orgão emissor do certificado"
            },
            date: {
                type: Type.STRING,
                description: "Data de emissão do certificado"
            }
        },
        required: ["id", "name", "organization", "date"]
    }
}

export const LanguageItemResponseSchema = {
    type: Type.ARRAY,
    description: "Idiomas",
    items: {
        type: Type.OBJECT,
        properties: {
            id: {
                type: Type.STRING,
                description: "Copie exatamente o ID recebido no currículo original para este item"
            },
            name: {
                type: Type.STRING,
                description: "Nome da lingua"
            },
            level: {
                type: Type.STRING,
                description: "Nível"
            }
        },
        required: ["id", "name", "level"]
    }
}

export const SkillsItemResponseSchema = {
    type: Type.ARRAY,
    description: "habilidades",
    items: {
        type: Type.STRING,
        description: "Nome da habilidade"
    }
}

export const CVResponseSchema = {
    type: Type.OBJECT,
    properties: {
        personal: PersonalDataResponseSchema,
        objective: {
            type: Type.STRING,
            description: "Seção objetivo do curriculo"
        },
        experience: ExperienceItemResponseSchema,
        education: EducationItemResponseSchema,
        certificates: CertificateItemResponseSchema,
        skills: SkillsItemResponseSchema,
        languages: LanguageItemResponseSchema,
    },
    required: ["personal", "objective", "experience", "education", "certificates", "skills", "languages"]
}