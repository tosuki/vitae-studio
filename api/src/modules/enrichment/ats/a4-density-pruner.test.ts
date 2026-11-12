import { describe, it, expect } from "vitest";
import { estimateCVHeight, pruneCurationToFitA4, A4_MAX_HEIGHT_PX } from "./a4-density-pruner";
import { CVData, TargetedCuration } from "../../common/model/cv.model";
import { CURATION_SYSTEM_PROMPT_EN } from "../gemini/curation.prompt";

// Perfil Mestre extenso com múltiplos itens (overflow garantido se não for podado)
const extensiveMasterProfile: CVData = {
    personal: {
        fullName: "Roberto Mendonça de Alencar",
        title: "Engenheiro de Software Sênior & Especialista em Plataformas de Dados",
        email: "roberto.alencar@techmail.com",
        phone: "11999887766",
        location: "São Paulo, SP",
        linkedin: "linkedin.com/in/roberto-alencar",
        github: "github.com/roberto-alencar"
    },
    objective: "Tenho mais de 8 anos de experiência construindo soluções em nuvem e liderando migrações críticas de arquitetura com foco em alta disponibilidade e performance.",
    experience: [
        {
            id: "exp-1",
            company: "Fintech Pagamentos SA",
            role: "Tech Lead / Especialista Backend",
            location: "São Paulo, SP",
            startDate: "01/2022",
            endDate: "",
            description: "Liderei equipe no desenvolvimento de APIs de alta concorrência."
        },
        {
            id: "exp-2",
            company: "E-Commerce Global Logistics",
            role: "Engenheiro de Software Pleno/Sênior",
            location: "Remoto",
            startDate: "03/2019",
            endDate: "12/2021",
            description: "Desenvolvi microsserviços de rastreamento e mensageria distribuída."
        },
        {
            id: "exp-3",
            company: "Consultoria Inovação Digital",
            role: "Desenvolvedor Backend",
            location: "São Paulo, SP",
            startDate: "01/2016",
            endDate: "02/2019",
            description: "Manutenção de sistemas legados e criação de integrações REST."
        },
        {
            id: "exp-4",
            company: "Startup Início de Carreira",
            role: "Desenvolvedor Júnior",
            location: "São Paulo, SP",
            startDate: "01/2014",
            endDate: "12/2015",
            description: "Auxiliei no desenvolvimento de sites institucionais."
        }
    ],
    education: [
        {
            id: "edu-1",
            institution: "Universidade de São Paulo (USP)",
            degree: "Bacharelado em Engenharia de Computação",
            startDate: "2010",
            endDate: "2015",
            description: "Ênfase em Sistemas Distribuídos e Bancos de Dados."
        },
        {
            id: "edu-2",
            institution: "FIAP",
            degree: "Pós-graduação em Arquitetura de Software Cloud",
            startDate: "2017",
            endDate: "2018",
            description: ""
        }
    ],
    projects: [
        {
            id: "proj-1",
            name: "CloudQueue Engine",
            role: "Criador & Mantenedor",
            link: "github.com/roberto/cloudqueue",
            startDate: "2023",
            endDate: "",
            description: "Engine de mensageria leve construída em TypeScript e Redis com suporte a 50k req/s."
        },
        {
            id: "proj-2",
            name: "DataPipeline CLI",
            role: "Arquiteto",
            link: "github.com/roberto/datapipeline",
            startDate: "2022",
            endDate: "2023",
            description: "CLI para migração automatizada de schemas PostgreSQL e bancos serverless."
        },
        {
            id: "proj-3",
            name: "Portfólio Pessoal Antigo",
            role: "Dev",
            link: "github.com/roberto/old-portfolio",
            startDate: "2018",
            endDate: "",
            description: "Site simples em HTML e CSS."
        }
    ],
    certificates: [
        {
            id: "cert-1",
            name: "AWS Certified Solutions Architect - Professional",
            organization: "Amazon Web Services",
            date: "2023"
        },
        {
            id: "cert-2",
            name: "Kubernetes Certified Administrator (CKA)",
            organization: "Linux Foundation",
            date: "2022"
        },
        {
            id: "cert-3",
            name: "Scrum Master Certified (PSM I)",
            organization: "Scrum.org",
            date: "2019"
        },
        {
            id: "cert-4",
            name: "Curso de Inglês Instrumental",
            organization: "Escola de Idiomas",
            date: "2015"
        }
    ],
    skills: [
        "Node.js", "TypeScript", "PostgreSQL", "Docker", "Kubernetes",
        "Kafka", "Redis", "AWS", "Arquitetura Hexagonal", "CI/CD",
        "Microsserviços", "Terraform", "Jest", "TDD"
    ],
    languages: [
        { id: "lang-1", name: "Português", level: "Nativo" },
        { id: "lang-2", name: "Inglês", level: "Avançado" }
    ],
    style: {
        theme: "modern",
        fontFamily: "inter",
        accentColor: "#2563eb",
        spacing: "normal"
    }
};

describe("A4 Density Pruner & 1-Page Physical Guarantee", () => {
    it("validates CURATION_SYSTEM_PROMPT_EN contains first-person singular voice, dynamic title, no-quotes rule and smart consolidation", () => {
        expect(CURATION_SYSTEM_PROMPT_EN).toContain("First-Person Singular Active Voice");
        expect(CURATION_SYSTEM_PROMPT_EN).toContain("FIRST PERSON SINGULAR");
        expect(CURATION_SYSTEM_PROMPT_EN).toContain("STRICT NO-QUOTES RULE");
        expect(CURATION_SYSTEM_PROMPT_EN).toContain("Desenvolvi");
        expect(CURATION_SYSTEM_PROMPT_EN).toContain("Estruturei");
        expect(CURATION_SYSTEM_PROMPT_EN).toContain("420-480 characters");
        expect(CURATION_SYSTEM_PROMPT_EN).toContain("Mandatory Experience Rewriting & Smart Consolidation");
        expect(CURATION_SYSTEM_PROMPT_EN).toContain("Strict Anti-Hallucination");
        expect(CURATION_SYSTEM_PROMPT_EN).toContain("Strict 1-Page A4 Budget");
    });

    it("detects overflow on an unpruned extensive profile with all items enabled", () => {
        // Mock de uma curadoria sem poda prévia com muitos itens habilitados
        const rawCurationWithoutPruning: TargetedCuration = {
            jobTitle: "Staff Software Engineer",
            company: "Tech Giant",
            matchScore: 95,
            matchedKeywords: ["Node.js", "TypeScript", "AWS", "Kubernetes", "PostgreSQL"],
            missingKeywords: [],
            tailoredObjective: "Tenho sólida experiência de mais de 8 anos como Engenheiro de Software liderando arquiteturas distribuídas de alta escala em 'Node.js', 'TypeScript' e 'AWS'. Estruturei soluções com mensageria e otimizei latência de microsserviços críticos, com forte visão de produto e liderança ágil. Busco alavancar a plataforma da Tech Giant combinando resiliência e alta performance.",
            experience: {
                "exp-1": {
                    included: true,
                    relevanceScore: 98,
                    tailoredDescription: "• Estruturei servidores Ubuntu com Docker, Forgejo e pipelines de CI/CD, além de criar uma CLI customizada para migrações de banco, padronizando e acelerando o ciclo de deploy.\n• Desenvolvi microsserviços de pagamento em 'Node.js' suportando mais de 25.000 transações por segundo com latência p99 inferior a 60ms.\n• Automatizei fluxos de conciliação financeira reduzindo o tempo de processamento de lote diário em 70%.\n• Lidero equipe ágil de 8 desenvolvedores aplicando TDD e code review rigoroso com cobertura de testes superior a 90%."
                },
                "exp-2": {
                    included: true,
                    relevanceScore: 90,
                    tailoredDescription: "• Implementei barramento de mensageria assíncrona com 'Kafka' e 'Redis', garantindo entrega garantida de eventos críticos entre 14 microsserviços.\n• Otimizei queries analíticas no 'PostgreSQL' reduzindo o consumo de CPU do cluster de banco de dados em 45%."
                },
                "exp-3": {
                    included: true,
                    relevanceScore: 80,
                    tailoredDescription: "• Desenvolvi integrações RESTful seguras com mais de 30 fornecedores externos utilizando boas práticas de autenticação OAuth2 e rate limiting.\n• Refatorei módulos legados aumentando a estabilidade do sistema e eliminando incidentes recorrentes de indisponibilidade."
                },
                "exp-4": {
                    included: true,
                    relevanceScore: 40,
                    tailoredDescription: "• Auxiliei no suporte a sistemas web."
                }
            },
            projects: {
                "proj-1": {
                    included: true,
                    relevanceScore: 95,
                    tailoredDescription: "• Desenvolvi engine de mensageria leve e escalável em 'TypeScript' e 'Redis' com suporte comprovado a mais de 50k req/s."
                },
                "proj-2": {
                    included: true,
                    relevanceScore: 88,
                    tailoredDescription: "• Criei CLI customizada para migração determinística de schemas em bancos PostgreSQL."
                },
                "proj-3": {
                    included: true,
                    relevanceScore: 40,
                    tailoredDescription: "• Portfólio pessoal."
                }
            },
            education: {
                "edu-1": { included: true, relevanceScore: 95 },
                "edu-2": { included: true, relevanceScore: 85 }
            },
            certificates: {
                "cert-1": { included: true, relevanceScore: 95 },
                "cert-2": { included: true, relevanceScore: 92 },
                "cert-3": { included: true, relevanceScore: 70 },
                "cert-4": { included: true, relevanceScore: 30 }
            },
            selectedSkills: [
                "Node.js", "TypeScript", "PostgreSQL", "Docker", "Kubernetes",
                "Kafka", "Redis", "AWS", "CI/CD", "TDD", "Microsserviços", "Terraform"
            ]
        };

        const initialDensity = estimateCVHeight(extensiveMasterProfile, rawCurationWithoutPruning, "normal");
        // Deve estourar largamente os 1120px da folha A4
        expect(initialDensity.totalHeight).toBeGreaterThan(A4_MAX_HEIGHT_PX);
        expect(initialDensity.totalHeight).toBeGreaterThan(1300);

        // Executa o algoritmo de poda progressiva determinística (Camada B)
        const pruneResult = pruneCurationToFitA4(extensiveMasterProfile, rawCurationWithoutPruning);

        // A altura final DEVE caber estritamente na folha A4 (<= 1120px)
        expect(pruneResult.estimatedHeight).toBeLessThanOrEqual(A4_MAX_HEIGHT_PX);
        expect(pruneResult.prunedLevelsApplied.length).toBeGreaterThan(0);

        // Verifica a fila de remoção progressiva dos níveis:
        // Nível 1: Certificações desativadas para economizar espaço
        expect(pruneResult.curation.certificates["cert-1"].included).toBe(false);
        expect(pruneResult.curation.certificates["cert-4"].included).toBe(false);

        // Nível 2: Projeto irrelevante desativado
        expect(pruneResult.curation.projects["proj-3"].included).toBe(false);

        // Nível 3: Experiência 4 (júnior antiga) desativada
        expect(pruneResult.curation.experience["exp-4"].included).toBe(false);

        // Verifica que o texto e os verbos em 1ª pessoa foram rigorosamente mantidos
        expect(pruneResult.curation.tailoredObjective).toContain("Tenho sólida experiência");
        const exp1Desc = pruneResult.curation.experience["exp-1"].tailoredDescription || "";
        expect(exp1Desc).toContain("Estruturei");
        expect(exp1Desc).toContain("Desenvolvi");

        // Confirma que o resumo profissional respeita a faixa estrita de caracteres
        expect(pruneResult.curation.tailoredObjective.length).toBeGreaterThanOrEqual(250);
        expect(pruneResult.curation.tailoredObjective.length).toBeLessThanOrEqual(520);
    });
});
