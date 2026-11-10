import { describe, it, expect, vi } from "vitest";
import Fastify from "fastify";
import { validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";
import router from "../http/router";
import { normalizeCuratedResult } from "./ai/openai-compatible.provider";
import { CVData } from "../common/model/cv.model";

const mockCv: CVData = {
    personal: {
        fullName: "Ana Dev",
        title: "Frontend Engineer",
        email: "ana@email.com",
        phone: "11999999999",
        location: "São Paulo, SP",
        linkedin: "linkedin.com/in/anadev",
        github: "github.com/anadev"
    },
    objective: "Desenvolvedora focada em ecossistema React e TypeScript.",
    experience: [
        {
            id: "exp-1",
            company: "Tech Corp",
            role: "Frontend Engineer",
            location: "Remoto",
            startDate: "2023-01",
            endDate: "",
            description: "Desenvolvimento de aplicações React e Next.js."
        },
        {
            id: "exp-2",
            company: "Startup XYZ",
            role: "Fullstack Dev",
            location: "São Paulo",
            startDate: "2021-01",
            endDate: "2022-12",
            description: "Construção de APIs e dashboards."
        },
        {
            id: "exp-3",
            company: "Agência Web",
            role: "Junior Web Dev",
            location: "São Paulo",
            startDate: "2019-06",
            endDate: "2020-12",
            description: "Criação de landing pages e sites em WordPress."
        }
    ],
    projects: [
        {
            id: "proj-1",
            name: "Vitae Studio",
            role: "Criadora",
            link: "github.com/anadev/vitae",
            startDate: "2024",
            endDate: "",
            description: "Gerador de currículos open-source."
        },
        {
            id: "proj-2",
            name: "E-commerce Template",
            role: "Frontend",
            link: "github.com/anadev/store",
            startDate: "2023",
            endDate: "2023",
            description: "Template de loja virtual com Next.js."
        }
    ],
    education: [
        {
            id: "edu-1",
            institution: "USP",
            degree: "Sistemas de Informação",
            startDate: "2018",
            endDate: "2022",
            description: "Bacharelado"
        }
    ],
    certificates: [
        {
            id: "cert-1",
            name: "AWS Certified Developer",
            organization: "Amazon Web Services",
            date: "2023"
        }
    ],
    skills: ["React", "TypeScript", "Next.js", "Node.js", "Docker", "TailwindCSS"],
    languages: [{ id: "lang-1", name: "Inglês", level: "Avançado" }],
    style: {
        theme: "modern",
        fontFamily: "inter",
        accentColor: "#7c3aed",
        spacing: "normal"
    }
};

describe("Master Profile & Job Curation Pipeline", () => {
    it("normalizes curation output for strict 1-page A4 constraints and preserves item IDs", () => {
        const rawModelOutput = {
            matchScore: 92,
            matchedKeywords: ["React", "Next.js", "TypeScript"],
            missingKeywords: ["GraphQL"],
            tailoredObjective: "Frontend Engineer especialista em React e Next.js com foco em alta performance.",
            experienceCuration: [
                {
                    id: "exp-1",
                    included: true,
                    relevanceScore: 98,
                    tailoredDescription: "• Liderança no desenvolvimento com Next.js e React.\n• Redução de tempo de carregamento em 40%."
                },
                {
                    id: "exp-2",
                    included: true,
                    relevanceScore: 75,
                    tailoredDescription: "• Desenvolvimento de dashboards interativos."
                },
                {
                    id: "exp-3",
                    included: false,
                    relevanceScore: 30,
                    tailoredDescription: "Landing pages em WordPress."
                }
            ],
            projectCuration: [
                {
                    id: "proj-1",
                    included: true,
                    relevanceScore: 95,
                    tailoredDescription: "Aplicação Next.js de alta escala para criação de currículos."
                },
                {
                    id: "proj-2",
                    included: false,
                    relevanceScore: 40,
                    tailoredDescription: "E-commerce template."
                }
            ],
            educationCuration: [
                { id: "edu-1", included: true, relevanceScore: 90 }
            ],
            certificateCuration: [
                { id: "cert-1", included: true, relevanceScore: 85 }
            ],
            selectedSkills: ["React", "Next.js", "TypeScript", "TailwindCSS"]
        };

        const result = normalizeCuratedResult(rawModelOutput, mockCv, {
            roleTitle: "Senior React Engineer",
            jobDescription: "Procuramos especialista em React, TypeScript e Next.js."
        });

        expect(result.jobTitle).toBe("Senior React Engineer");
        expect(result.matchScore).toBe(92);
        expect(result.matchedKeywords).toContain("React");
        expect(result.tailoredObjective).toContain("Frontend Engineer");

        // Experiences: exp-1 and exp-2 included, exp-3 excluded
        expect(result.experience["exp-1"].included).toBe(true);
        expect(result.experience["exp-1"].tailoredDescription).toContain("Liderança no desenvolvimento");
        expect(result.experience["exp-3"].included).toBe(false);

        // Projects: proj-1 included, proj-2 excluded
        expect(result.projects["proj-1"].included).toBe(true);
        expect(result.projects["proj-2"].included).toBe(false);

        // Skills prioritized
        expect(result.selectedSkills).toEqual(["React", "Next.js", "TypeScript", "TailwindCSS"]);
    });

    it("handles fallback and defaults when AI returns incomplete data", () => {
        const brokenOutput = {
            matchScore: "not-a-number",
            experienceCuration: [] // empty
        };

        const result = normalizeCuratedResult(brokenOutput, mockCv, {
            roleTitle: "Tech Lead",
            jobDescription: "Vaga de liderança técnica."
        });

        expect(result.matchScore).toBe(80);
        expect(result.jobTitle).toBe("Tech Lead");
        // Defaults to including top 2 experiences for safety
        expect(result.experience["exp-1"].included).toBe(true);
        expect(result.experience["exp-2"].included).toBe(true);
        expect(result.experience["exp-3"].included).toBe(false);
    });

    it("exposes POST /tasks/curate with validation schema", async () => {
        const app = Fastify();
        app.setValidatorCompiler(validatorCompiler);
        app.setSerializerCompiler(serializerCompiler);
        await app.register(router);

        // 1. Missing job description returns 400
        const badRes = await app.inject({
            method: "POST",
            url: "/tasks/curate",
            payload: {
                job: {
                    roleTitle: "Senior Dev",
                    jobDescription: "curto" // less than 10 chars
                },
                cv: mockCv
            }
        });
        expect(badRes.statusCode).toBe(400);

        // 2. Missing cv returns 400
        const badCvRes = await app.inject({
            method: "POST",
            url: "/tasks/curate",
            payload: {
                job: {
                    roleTitle: "Senior Dev",
                    jobDescription: "Vaga de desenvolvimento de software completa e detalhada"
                }
            }
        });
        expect(badCvRes.statusCode).toBe(400);

        await app.close();
    });
});
