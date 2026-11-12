import { describe, it, expect } from "vitest";
import http from "node:http";
import {
    cleanJobDescription,
    extractJobKeywords,
    calculateDynamicMaxTokens,
    sanitizeResumeText
} from "./text-sanitizer";
import {
    ATS_SYSTEM_PROMPT_EN,
    buildAtsUserPrompt
} from "./ats-diff.prompt";
import {
    applyAtsDiffsToCV,
    enrichCVWithOpenAICompatible,
    curateCVWithOpenAICompatible,
    extractCVFromTextWithOpenAICompatible,
    extractJsonFromText,
    extractRawContentFromChoice
} from "../ai/openai-compatible.provider";
import {
    CURATION_SYSTEM_PROMPT_EN,
    buildCurationUserPayload
} from "../gemini/curation.prompt";
import {
    RESUME_EXTRACTION_SYSTEM_PROMPT_EN,
    buildResumeExtractionUserPayload
} from "../parser/resume-extraction.prompt";
import { CVData } from "../../common/model/cv.model";

const sampleCV: CVData = {
    personal: {
        fullName: "Carlos Silva",
        title: "Engenheiro de Software",
        email: "carlos@example.com",
        phone: "11988887777",
        location: "São Paulo, SP",
        linkedin: "linkedin.com/in/carlossilva",
        github: "github.com/carlossilva"
    },
    objective: "Desenvolver soluções robustas de backend.",
    experience: [
        {
            id: "exp-1",
            company: "Tech Payments",
            role: "Backend Developer",
            location: "Remoto",
            startDate: "02/2022",
            endDate: "",
            description: "Responsável pelo desenvolvimento de APIs de pagamento e manutenção do banco de dados."
        }
    ],
    education: [
        {
            id: "edu-1",
            institution: "USP",
            degree: "Ciência da Computação",
            startDate: "2018",
            endDate: "2022",
            description: "Bacharelado"
        }
    ],
    projects: [
        {
            id: "proj-1",
            name: "Vitae Studio",
            role: "Criador",
            link: "github.com/carlossilva/vitae",
            startDate: "2024",
            endDate: "",
            description: "Criou um construtor de currículos com inteligência artificial."
        }
    ],
    certificates: [
        {
            id: "cert-1",
            name: "AWS Solutions Architect",
            organization: "Amazon Web Services",
            date: "05/2024"
        }
    ],
    skills: ["TypeScript", "Node.js", "Docker"],
    languages: [
        {
            id: "lang-1",
            name: "Inglês",
            level: "Avançado"
        }
    ],
    style: {
        theme: "modern",
        fontFamily: "Inter",
        accentColor: "#7c3aed",
        spacing: "normal"
    }
};

describe("ATS Optimization & DeepSeek Token Efficiency Suite", () => {
    describe("Text Sanitizer & Local Keywords", () => {
        it("strips malicious/bloated HTML from LinkedIn job postings into clean plain text", () => {
            const bloatedHtml = `
                <div class="job-view-layout">
                    <script>alert("ignore script");</script>
                    <style>.hidden { display: none; }</style>
                    <h1>Senior Backend Engineer - Node.js &amp; Cloud</h1>
                    <p>Estamos buscando uma pessoa desenvolvedora para atuar com <strong>Node.js</strong>, <strong>TypeScript</strong> e <strong>PostgreSQL</strong>.</p>
                    <ul>
                        <li>Construir microsserviços escaláveis de alta performance</li>
                        <li>Experiência com Redis, Docker e Kubernetes na AWS</li>
                    </ul>
                    <!-- tracking comments -->
                    <svg><path d="M0 0h24v24H0z"></path></svg>
                </div>
            `;

            const cleaned = cleanJobDescription(bloatedHtml);
            expect(cleaned).toContain("Senior Backend Engineer - Node.js & Cloud");
            expect(cleaned).toContain("Node.js");
            expect(cleaned).toContain("TypeScript");
            expect(cleaned).toContain("PostgreSQL");
            expect(cleaned).not.toContain("<script>");
            expect(cleaned).not.toContain("<style>");
            expect(cleaned).not.toContain("<svg>");
            expect(cleaned).not.toContain("&amp;");
            expect(cleaned.length).toBeLessThan(bloatedHtml.length);
        });

        it("extracts relevant technical keywords while ignoring generic stop words", () => {
            const jobText = `
                Vaga de Engenheiro de Software Sênior. Requisitos obrigatórios:
                TypeScript, Node.js, Fastify, Redis, Docker, Kubernetes, AWS, PostgreSQL.
                Desejável experiência com CI/CD e arquitetura orientada a eventos.
                A empresa oferece benefícios CLT e horário flexível.
            `;

            const keywords = extractJobKeywords(jobText);
            expect(keywords).toContain("typescript");
            expect(keywords).toContain("node.js");
            expect(keywords).toContain("docker");
            expect(keywords).not.toContain("vaga");
            expect(keywords).not.toContain("empresa");
            expect(keywords).not.toContain("requisitos");
        });

        it("sanitizes resume text and calculates dynamic max_tokens", () => {
            const rawText = "Experiência   com   \n\n\n\n Node.js   e APIs REST. \x00";
            const sanitized = sanitizeResumeText(rawText);
            expect(sanitized).toBe("Experiência com \n\n Node.js e APIs REST.");

            expect(calculateDynamicMaxTokens(1)).toBeGreaterThanOrEqual(180);
            expect(calculateDynamicMaxTokens(3)).toBeLessThanOrEqual(500);
            expect(calculateDynamicMaxTokens(15)).toBeLessThanOrEqual(2048);
        });
    });

    describe("ATS Context Caching System Prompt (DeepSeek)", () => {
        it("validates that ATS_SYSTEM_PROMPT_EN exceeds 200 tokens for DeepSeek Context Caching and specifies Google XYZ and pt-BR", () => {
            // Conta palavras aproximadas: no vocabulário BPE, tokens >= words * 1.3
            const wordCount = ATS_SYSTEM_PROMPT_EN.split(/\s+/).filter(Boolean).length;
            expect(wordCount).toBeGreaterThan(150); // mais de 250 tokens garantidos

            expect(ATS_SYSTEM_PROMPT_EN).toContain("Google's XYZ Framework");
            expect(ATS_SYSTEM_PROMPT_EN).toContain("Brazilian Portuguese (pt-BR)");
            expect(ATS_SYSTEM_PROMPT_EN).toContain("Strict Anti-Hallucination Guardrail");
            expect(ATS_SYSTEM_PROMPT_EN).toContain("diffs");
        });

        it("builds a high-density, concise user prompt containing only IDs and texts", () => {
            const items = [
                { id: "exp-1", text: "Fiz APIs em Node.js", role: "Dev", company: "Empresa X" }
            ];
            const prompt = buildAtsUserPrompt("Backend Engineer", ["node.js", "redis"], items);

            expect(prompt).toContain("TARGET ROLE: Backend Engineer");
            expect(prompt).toContain("TARGET KEYWORDS: node.js, redis");
            expect(prompt).toContain("[exp-1] (Dev @ Empresa X):");
            expect(prompt).toContain("Fiz APIs em Node.js");
            // Não deve conter lixo de dados pessoais desnecessários
            expect(prompt).not.toContain("carlos@example.com");
        });
    });

    describe("Diff Application & Anti-Hallucination Guardrails", () => {
        it("applies diffs cleanly to CVData without inventing IDs or mutating unrelated sections", () => {
            const diffs = [
                {
                    id: "exp-1",
                    improved: "• Conquistou 99.98% de disponibilidade em APIs de pagamento, mensurado por monitoramento Datadog, implementando microsserviços Node.js e cache Redis."
                },
                {
                    id: "proj-1",
                    improved: "• Conquistou redução de 40% no tempo de criação de currículos, mensurado por métricas de uso de 5.000 usuários, arquitetando plataforma open source com TypeScript e IA."
                }
            ];

            const result = applyAtsDiffsToCV(sampleCV, diffs, "Engenheiro Backend Sênior", ["PostgreSQL", "Redis"]);

            expect(result.experience[0].id).toBe("exp-1");
            expect(result.experience[0].description).toContain("Conquistou 99.98% de disponibilidade");
            expect(result.projects?.[0].description).toContain("Conquistou redução de 40%");

            // Dados imutáveis preservados
            expect(result.personal.email).toBe(sampleCV.personal.email);
            expect(result.personal.phone).toBe(sampleCV.personal.phone);
            expect(result.education[0].institution).toBe("USP");
            expect(result.certificates[0].name).toBe("AWS Solutions Architect");

            // Skills enriquecidas com as keywords da vaga
            expect(result.skills).toContain("PostgreSQL");
            expect(result.skills).toContain("Redis");
        });
    });

    describe("DeepSeek Mock Pipeline: Diffs vs Full Output", () => {
        let mockServer: http.Server | null = null;
        let mockPort = 0;
        let lastReceivedMessages: any[] = [];

        it("optimizes CV using DeepSeek Diffs format with Context Caching system prompt and max_tokens", async () => {
            mockServer = http.createServer((req, res) => {
                let body = "";
                req.on("data", chunk => { body += chunk; });
                req.on("end", () => {
                    const parsedReq = JSON.parse(body);
                    lastReceivedMessages = parsedReq.messages || [];

                    // Simula retorno do DeepSeek com resposta em Diffs minificado e telemetria de cache
                    const diffResponse = {
                        diffs: [
                            {
                                id: "exp-1",
                                improved: "• Conquistou 30% de melhoria na taxa de aprovação de pagamentos, mensurado por telemetria Grafana, refatorando queries SQL e adotando Fastify com TypeScript."
                            }
                        ]
                    };

                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        choices: [
                            {
                                message: {
                                    content: JSON.stringify(diffResponse)
                                }
                            }
                        ],
                        usage: {
                            prompt_tokens: 420,
                            completion_tokens: 85,
                            total_tokens: 505,
                            prompt_cache_hit_tokens: 280, // Context Cache Hit no DeepSeek!
                            prompt_cache_miss_tokens: 140
                        }
                    }));
                });
            });

            await new Promise<void>(resolve => {
                mockServer!.listen(0, "127.0.0.1", () => {
                    const addr = mockServer!.address();
                    if (addr && typeof addr === "object") mockPort = addr.port;
                    resolve();
                });
            });

            const result = await enrichCVWithOpenAICompatible({
                baseUrl: `http://127.0.0.1:${mockPort}`,
                apiKey: "sk-fake-deepseek-key",
                model: "deepseek-chat",
                rawHtml: "<html><body><h1>Senior Backend Developer</h1><p>Node.js, TypeScript e Redis</p></body></html>",
                cv: sampleCV
            });

            expect(result.data).toBeDefined();
            expect(result.data?.experience[0].description).toContain("Conquistou 30% de melhoria");
            expect(result.data?.personal.email).toBe(sampleCV.personal.email);

            // Verifica que o system prompt estático em inglês foi enviado no início (para ativar o Context Caching)
            expect(lastReceivedMessages[0].role).toBe("system");
            expect(lastReceivedMessages[0].content).toContain("Principal Technical Recruiter");
            expect(lastReceivedMessages[1].role).toBe("user");
            expect(lastReceivedMessages[1].content).toContain("TARGET ROLE:");

            await new Promise<void>(resolve => mockServer!.close(() => resolve()));
        });
    });

    describe("Resilient JSON Parser & Sanitizer (extractJsonFromText)", () => {
        it("successfully extracts clean JSON inside markdown codeblocks and think blocks", () => {
            const raw = `
            <think>
            Analyzing candidate against ATS requirements...
            Selected score: 85
            </think>
            \`\`\`json
            {
                "matchScore": 85,
                "matchedKeywords": ["Node.js", "TypeScript"]
            }
            \`\`\`
            `;
            const parsed = extractJsonFromText(raw) as any;
            expect(parsed.matchScore).toBe(85);
            expect(parsed.matchedKeywords).toEqual(["Node.js", "TypeScript"]);
        });

        it("heals and parses JSON with unescaped internal double quotes inside string values", () => {
            // Emula exatamente o erro: Expected ',' or '}' after property value in JSON at position 268
            const rawWithQuotes = `{"tailoredObjective": "Atuou como "Tech Lead", gerenciando 10 devs no ecossistema "Cloud".", "matchScore": 88}`;
            const parsed = extractJsonFromText(rawWithQuotes) as any;
            expect(parsed.matchScore).toBe(88);
            expect(parsed.tailoredObjective).toContain("Tech Lead");
            expect(parsed.tailoredObjective).toContain("Cloud");
        });

        it("heals and parses JSON with literal unescaped newlines and tabs inside strings", () => {
            const rawWithNewlines = `{"tailoredDescription": "• Desenvolveu APIs escaláveis em Node.js
• Reduziu latência em 35% com Redis
• Liderou equipe ágil", "matchScore": 92}`;
            const parsed = extractJsonFromText(rawWithNewlines) as any;
            expect(parsed.matchScore).toBe(92);
            expect(parsed.tailoredDescription).toContain("Desenvolveu APIs");
            expect(parsed.tailoredDescription).toContain("Reduziu latência");
        });

        it("strips trailing commas in nested objects and arrays", () => {
            const rawWithTrailingCommas = `{"skills": ["Node.js", "PostgreSQL",], "metrics": {"latency": "35%",},}`;
            const parsed = extractJsonFromText(rawWithTrailingCommas) as any;
            expect(parsed.skills).toEqual(["Node.js", "PostgreSQL"]);
            expect(parsed.metrics.latency).toBe("35%");
        });

        it("recovers truncated JSON caused by token limits", () => {
            const truncated = `{"matchScore": 85, "tailoredObjective": "Liderança de times de engenharia`;
            const parsed = extractJsonFromText(truncated) as any;
            expect(parsed.matchScore).toBe(85);
            expect(parsed.tailoredObjective).toBe("Liderança de times de engenharia");
        });
    });

    describe("Full System Prompts Standards (Curation & Extraction)", () => {
        it("verifies CURATION_SYSTEM_PROMPT_EN complies with English, Context Caching (>200 words), 1-page A4, Google XYZ, no-quotes and pt-BR", () => {
            const wordCount = CURATION_SYSTEM_PROMPT_EN.split(/\s+/).filter(Boolean).length;
            expect(wordCount).toBeGreaterThan(200); // garante > 300 tokens

            expect(CURATION_SYSTEM_PROMPT_EN).toContain("Google's XYZ Framework");
            expect(CURATION_SYSTEM_PROMPT_EN).toContain("Strict 1-Page A4 Budget");
            expect(CURATION_SYSTEM_PROMPT_EN).toContain("Brazilian Portuguese (pt-BR)");
            expect(CURATION_SYSTEM_PROMPT_EN).toContain("STRICT NO-QUOTES RULE");
            expect(CURATION_SYSTEM_PROMPT_EN).toContain("tailoredTitle");
            expect(CURATION_SYSTEM_PROMPT_EN).toContain("tailoredObjective");
            expect(CURATION_SYSTEM_PROMPT_EN).toContain("experienceCuration");
        });

        it("verifies RESUME_EXTRACTION_SYSTEM_PROMPT_EN complies with English, Context Caching, security injection and 1:1 schema", () => {
            const wordCount = RESUME_EXTRACTION_SYSTEM_PROMPT_EN.split(/\s+/).filter(Boolean).length;
            expect(wordCount).toBeGreaterThan(180); // ultrapassa 250 tokens

            expect(RESUME_EXTRACTION_SYSTEM_PROMPT_EN).toContain("Prompt Injection Defense");
            expect(RESUME_EXTRACTION_SYSTEM_PROMPT_EN).toContain("<resume_document>");
            expect(RESUME_EXTRACTION_SYSTEM_PROMPT_EN).toContain("Personal Data Mapping");
            expect(RESUME_EXTRACTION_SYSTEM_PROMPT_EN).toContain("MM/YYYY");
            expect(RESUME_EXTRACTION_SYSTEM_PROMPT_EN).toContain("original language (pt-BR)");
        });

        it("curateCVWithOpenAICompatible sends immutable English system prompt, temperature 0.25 and safe max_tokens", async () => {
            let lastRequestBody: any = null;

            const server = http.createServer((req, res) => {
                let body = "";
                req.on("data", chunk => { body += chunk; });
                req.on("end", () => {
                    lastRequestBody = JSON.parse(body);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    matchScore: 92,
                                    matchedKeywords: ["TypeScript", "Node.js"],
                                    missingKeywords: ["AWS"],
                                    tailoredObjective: "Engenheiro backend focado em alta escala.",
                                    experienceCuration: [{ id: "exp-1", included: true, relevanceScore: 95, tailoredDescription: "• Conquistou 40% de ganho..." }],
                                    projectCuration: [{ id: "proj-1", included: true, relevanceScore: 90, tailoredDescription: "• Desenvolveu app..." }],
                                    educationCuration: [{ id: "edu-1", included: true, relevanceScore: 90 }],
                                    certificateCuration: [{ id: "cert-1", included: true, relevanceScore: 80 }],
                                    selectedSkills: ["TypeScript", "Node.js"]
                                })
                            }
                        }],
                        usage: { prompt_tokens: 420, completion_tokens: 310, prompt_cache_hit_tokens: 420, total_tokens: 730 }
                    }));
                });
            });

            let port = 0;
            await new Promise<void>(resolve => {
                server.listen(0, "127.0.0.1", () => {
                    const addr = server.address();
                    if (addr && typeof addr === "object") port = addr.port;
                    resolve();
                });
            });

            const result = await curateCVWithOpenAICompatible({
                baseUrl: `http://127.0.0.1:${port}`,
                apiKey: "sk-mock-key",
                model: "deepseek-chat",
                cv: sampleCV,
                job: {
                    roleTitle: "Staff Software Engineer",
                    jobDescription: "Buscamos pessoa especialista em Node.js e microsserviços."
                }
            });

            expect(result.data).toBeDefined();
            expect(result.data?.matchScore).toBe(92);
            expect(lastRequestBody.messages[0].role).toBe("system");
            expect(lastRequestBody.messages[0].content).toContain("Principal Technical Recruiter");
            expect(lastRequestBody.temperature).toBe(0.25);
            expect(lastRequestBody.max_tokens).toBe(1400);

            await new Promise<void>(resolve => server.close(() => resolve()));
        });

        it("extractCVFromTextWithOpenAICompatible sends immutable English system prompt, temperature 0.1 and max_tokens 4000", async () => {
            let lastRequestBody: any = null;

            const server = http.createServer((req, res) => {
                let body = "";
                req.on("data", chunk => { body += chunk; });
                req.on("end", () => {
                    lastRequestBody = JSON.parse(body);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    personal: { fullName: "Carlos Silva", email: "carlos@example.com" },
                                    objective: "Desenvolver sistemas.",
                                    experience: [{ id: "exp-1", company: "Empresa", role: "Dev", startDate: "01/2022", endDate: "", description: "APIs" }],
                                    education: [],
                                    projects: [],
                                    certificates: [],
                                    skills: ["Node.js"],
                                    languages: []
                                })
                            }
                        }],
                        usage: { prompt_tokens: 500, completion_tokens: 200, prompt_cache_hit_tokens: 500, total_tokens: 700 }
                    }));
                });
            });

            let port = 0;
            await new Promise<void>(resolve => {
                server.listen(0, "127.0.0.1", () => {
                    const addr = server.address();
                    if (addr && typeof addr === "object") port = addr.port;
                    resolve();
                });
            });

            const result = await extractCVFromTextWithOpenAICompatible({
                baseUrl: `http://127.0.0.1:${port}`,
                apiKey: "sk-mock-key",
                model: "deepseek-chat",
                rawResumeText: "Carlos Silva - carlos@example.com - Desenvolvedor Node.js"
            });

            expect(result.data).toBeDefined();
            expect(result.data?.personal.fullName).toBe("Carlos Silva");
            expect(lastRequestBody.messages[0].role).toBe("system");
            expect(lastRequestBody.messages[0].content).toContain("Senior People Analytics");
            expect(lastRequestBody.temperature).toBe(0.1);
            expect(lastRequestBody.max_tokens).toBe(4000);

            await new Promise<void>(resolve => server.close(() => resolve()));
        });

        it("extractRawContentFromChoice fallback extracts from content, text, reasoning_content and reasoning", () => {
            expect(extractRawContentFromChoice({ message: { content: "  json payload  " } })).toBe("json payload");
            expect(extractRawContentFromChoice({ text: "  legacy completion  " })).toBe("legacy completion");
            expect(extractRawContentFromChoice({ message: { content: "", reasoning_content: "  reasoning output  " } })).toBe("reasoning output");
            expect(extractRawContentFromChoice({ message: { content: null, reasoning: "  openrouter reasoning  " } })).toBe("openrouter reasoning");
            expect(extractRawContentFromChoice(null)).toBeNull();
        });

        it("curateCVWithOpenAICompatible returns clear error when finish_reason is length", async () => {
            const server = http.createServer((req, res) => {
                req.on("data", () => {});
                req.on("end", () => {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        choices: [{
                            message: { content: "", role: "assistant" },
                            finish_reason: "length"
                        }],
                        usage: { prompt_tokens: 3353, completion_tokens: 3200, total_tokens: 6553 }
                    }));
                });
            });

            let port = 0;
            await new Promise<void>(resolve => {
                server.listen(0, "127.0.0.1", () => {
                    const addr = server.address();
                    if (addr && typeof addr === "object") port = addr.port;
                    resolve();
                });
            });

            const result = await curateCVWithOpenAICompatible({
                baseUrl: `http://127.0.0.1:${port}`,
                apiKey: "sk-mock-key",
                model: "deepseek-flash",
                cv: sampleCV,
                job: { roleTitle: "Dev", jobDescription: "Desc" }
            });

            expect(result.err).toBeDefined();
            expect(result.err?.message).toContain("limite de tokens");
            expect(result.err?.message).toContain("deepseek-chat");

            await new Promise<void>(resolve => server.close(() => resolve()));
        });

        it("curateCVWithOpenAICompatible rejects partially truncated JSON (cut mid-summary without experiences)", async () => {
            const server = http.createServer((req, res) => {
                req.on("data", () => {});
                req.on("end", () => {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        choices: [{
                            message: {
                                content: `{"matchScore": 85, "tailoredObjective": "Tenho experiência construindo sistemas web, automações e`,
                                role: "assistant"
                            },
                            finish_reason: "stop"
                        }],
                        usage: { prompt_tokens: 1800, completion_tokens: 90, total_tokens: 1890 }
                    }));
                });
            });

            let port = 0;
            await new Promise<void>(resolve => {
                server.listen(0, "127.0.0.1", () => {
                    const addr = server.address();
                    if (addr && typeof addr === "object") port = addr.port;
                    resolve();
                });
            });

            const result = await curateCVWithOpenAICompatible({
                baseUrl: `http://127.0.0.1:${port}`,
                apiKey: "sk-mock-key",
                model: "deepseek-chat",
                cv: sampleCV,
                job: { roleTitle: "AI Engineer", company: "iFood", jobDescription: "Vaga de AI Engineer com foco em LLMs e Node.js." }
            });

            expect(result.err).toBeDefined();
            expect(result.err?.message).toContain("truncada");

            await new Promise<void>(resolve => server.close(() => resolve()));
        });

        it("simulates iFood AI Engineer curation: strips quotes/prefixes, applies dynamic headline, matches experiences even with UUID fallback, and fits 1 A4 page", async () => {
            const candidateWithUUIDs: CVData = {
                ...sampleCV,
                personal: {
                    ...sampleCV.personal,
                    title: "Desenvolvedor Backend"
                },
                experience: [
                    {
                        id: "uuid-fhemig-991",
                        company: "FHEMIG",
                        role: "Desenvolvedor Full Stack",
                        location: "Belo Horizonte, MG",
                        startDate: "01/2024",
                        endDate: "",
                        description: "Portal Institucional: Criei portal.\nSistema de Catracas: Fiz sistema.\nPainel Admin: Ajustei painel.\nDocker: Subi containers.\nBanco: Modelei SQL.\nTestes: Fiz testes."
                    },
                    {
                        id: "uuid-code-882",
                        company: "CODE Empresa Júnior",
                        role: "Desenvolvedor Backend",
                        location: "Belo Horizonte, MG",
                        startDate: "01/2023",
                        endDate: "12/2023",
                        description: "Projeto A: Desenvolvi.\nProjeto B: Mantive.\nProjeto C: Documentei."
                    }
                ],
                projects: [
                    {
                        id: "proj-ia-1",
                        name: "Vitae Studio AI",
                        role: "Criador",
                        link: "github.com/user/vitae",
                        startDate: "2025",
                        endDate: "",
                        description: "Sistema de curadoria com LLMs e workers BullMQ."
                    },
                    {
                        id: "proj-other-2",
                        name: "Blog Estático",
                        role: "Autor",
                        link: "github.com/user/blog",
                        startDate: "2022",
                        endDate: "2022",
                        description: "Blog simples em HTML."
                    }
                ]
            };

            const server = http.createServer((req, res) => {
                req.on("data", () => {});
                req.on("end", () => {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    matchScore: 91,
                                    matchedKeywords: ["Node.js", "TypeScript", "Docker", "LLMs"],
                                    missingKeywords: ["PyTorch"],
                                    tailoredTitle: "AI Engineer | Engenharia de Software & IA",
                                    tailoredObjective: "Tenho experiência prática no desenvolvimento de APIs em 'Node.js', automações com workers assíncronos e infraestrutura Linux com `Docker`. Estruturei projetos práticos integrando LLMs com engenharia de prompts e filas Redis, unindo engenharia backend e IA aplicada para os desafios do iFood.",
                                    // Simula modelo que retornou ID genérico em vez do UUID, mas preservou empresa/ordem
                                    experienceCuration: [
                                        {
                                            id: "exp-1",
                                            company: "FHEMIG",
                                            included: true,
                                            relevanceScore: 95,
                                            tailoredDescription: [
                                                "• Portal Institucional: Desenvolvi o portal e APIs em 'Node.js' e Docker aumentando a estabilidade operacional.",
                                                "• Sistema de Catracas: Automatizei fluxos assíncronos de integração reduzindo falhas operacionais em 45%.",
                                                "• Estruturei pipelines de CI/CD em servidores Ubuntu acelerando entregas contínuas.",
                                                "• Implementei testes adicionais de regressão."
                                            ]
                                        },
                                        {
                                            id: "exp-2",
                                            company: "CODE Empresa Júnior",
                                            included: true,
                                            relevanceScore: 85,
                                            tailoredDescription: "• Desenvolvi APIs em 'Node.js' e PostgreSQL para clientes reais.\n• Implementei entregas ágeis em equipe."
                                        }
                                    ],
                                    projectCuration: [
                                        { id: "proj-ia-1", included: true, relevanceScore: 98, tailoredDescription: "• Arquitetei pipeline com LLMs e workers BullMQ em Node.js." },
                                        { id: "proj-other-2", included: true, relevanceScore: 30, tailoredDescription: "• Blog simples." }
                                    ],
                                    educationCuration: [{ id: "edu-1", included: true, relevanceScore: 90 }],
                                    certificateCuration: [{ id: "cert-1", included: true, relevanceScore: 80 }],
                                    selectedSkills: ["TypeScript", "Node.js", "Docker", "LLMs", "PostgreSQL", "Redis", "BullMQ", "APIs REST", "Linux", "CI/CD"]
                                })
                            },
                            finish_reason: "stop"
                        }],
                        usage: { prompt_tokens: 1850, completion_tokens: 580, prompt_cache_hit_tokens: 620, total_tokens: 2430 }
                    }));
                });
            });

            let port = 0;
            await new Promise<void>(resolve => {
                server.listen(0, "127.0.0.1", () => {
                    const addr = server.address();
                    if (addr && typeof addr === "object") port = addr.port;
                    resolve();
                });
            });

            const result = await curateCVWithOpenAICompatible({
                baseUrl: `http://127.0.0.1:${port}`,
                apiKey: "sk-mock-key",
                model: "deepseek-chat",
                cv: candidateWithUUIDs,
                job: {
                    roleTitle: "AI Engineer",
                    company: "iFood",
                    jobDescription: "Buscamos AI Engineer com base em desenvolvimento backend, arquitetura, automação e integração de LLMs."
                }
            });

            expect(result.err).toBeUndefined();
            expect(result.data).toBeDefined();
            const curated = result.data!;

            // BUG 2 Checks: headline dinâmica, zero aspas ao redor de tecnologias, texto completo terminando em ponto
            expect(curated.tailoredTitle).toBe("AI Engineer | Engenharia de Software & IA");
            expect(curated.tailoredObjective).toContain("Node.js");
            expect(curated.tailoredObjective).not.toContain("'Node.js'");
            expect(curated.tailoredObjective).not.toContain("`Docker`");
            expect(curated.tailoredObjective.endsWith(".")).toBe(true);

            // BUG 3 Checks: experiências atualizadas mesmo com ID divergente, sem prefixos repetitivos e máx 3 bullets na principal
            const fhemigDesc = curated.experience["uuid-fhemig-991"].tailoredDescription || "";
            expect(fhemigDesc).not.toContain("Portal Institucional:");
            expect(fhemigDesc).not.toContain("Sistema de Catracas:");
            expect(fhemigDesc).not.toContain("'Node.js'");
            expect(fhemigDesc).toContain("Desenvolvi o portal e APIs em Node.js");
            const fhemigBullets = fhemigDesc.split("\n").filter(Boolean);
            expect(fhemigBullets.length).toBeLessThanOrEqual(3);

            const codeDesc = curated.experience["uuid-code-882"].tailoredDescription || "";
            expect(codeDesc).toContain("Desenvolvi APIs em Node.js");
            const codeBullets = codeDesc.split("\n").filter(Boolean);
            expect(codeBullets.length).toBeLessThanOrEqual(2);

            await new Promise<void>(resolve => server.close(() => resolve()));
        });
    });
});
