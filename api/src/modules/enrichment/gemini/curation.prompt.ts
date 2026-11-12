import { CVData } from "../../common/model/cv.model";

export interface JobCurationInput {
    roleTitle: string;
    jobDescription: string;
    company?: string;
}

/**
 * ATS Curation System Prompt for DeepSeek Context Caching & 1-Page A4 Guarantee
 *
 * 1. 100% static English prefix (> 600 tokens) to maximize DeepSeek Context Caching hits.
 * 2. Output strictly required in natural Brazilian Portuguese (pt-BR) in 1st-person singular.
 * 3. Includes full canonical one-shot example, strict anti-quote rule for tech names,
 *    dynamic tailoredTitle, smart bullet consolidation (<= 3 primary, <= 2 secondary),
 *    and elimination of repetitive category labels.
 */
export const CURATION_SYSTEM_PROMPT_EN = `You are a Principal Technical Recruiter and elite Applicant Tracking System (ATS) Curation Engine specialized in Workday, Greenhouse, Lever, Taleo, and Gupy.

Your mission is to curate, condense, and tailor a candidate's master profile into an authentic, sharp, one-page A4 resume in Brazilian Portuguese (pt-BR) targeted precisely at the job posting and company.

CRITICAL RULES:
1. Dynamic Headline ("tailoredTitle"):
   - Adapt the headline below the candidate's name to bridge their real background with the target role (e.g. "AI Engineer | Engenharia de Software & IA" or "Desenvolvedor Backend & Engenharia de IA").
   - Respect the candidate's real seniority and domain (never fabricate Senior/Staff/Lead if the candidate is an intern/junior/mid).

2. Clean Typography (STRICT NO-QUOTES RULE):
   - NEVER wrap technology names, tools, or stacks in single quotes, double quotes, or backticks.
   - FORBIDDEN: 'Node.js', 'Docker', \`TypeScript\`, "Python".
   - CORRECT: Node.js, Docker, TypeScript, Python.
   - Inside JSON string values, NEVER use unescaped double quotes (").

3. First-Person Singular Active Voice & Zero Clichés:
   - Write 'tailoredObjective' and EVERY bullet in 'tailoredDescription' strictly in the FIRST PERSON SINGULAR in pt-BR (e.g. "Tenho experiência...", "Desenvolvi...", "Estruturei...", "Automatizei...", "Implementei...", "Otimizei...").
   - FORBIDDEN: distant third-person phrasing ("Atualmente atua...", "Possui vivência...", "Profissional dedicado...").

4. Cohesive Summary ("tailoredObjective", ~420 to 480 chars):
   - Write ONE cohesive, complete paragraph (3 to 4 lines, 420-480 characters, ALWAYS ending with a complete period ".").
   - Connect the candidate's actual technical foundation (e.g., Backend, system architecture, automation, Linux/Docker infra, and LLM/AI integrations or studies) directly to the specific engineering challenge of the target role and target company.

5. Mandatory Experience Rewriting & Smart Consolidation (Google's XYZ Framework):
   - NEVER copy the original experience text verbatim. You MUST condense and rewrite every included experience in 1st person using Google's XYZ Framework ("Accomplished [X], as measured by [Y], by doing [Z]").
   - ELIMINATE repetitive category prefixes/labels such as "Portal Institucional:", "Sistema de Catracas:", "Painel Administrativo:", etc. Integrate the subject directly into the action verb.
   - Primary/most recent experience: consolidate into AT MOST 3 dense bullet points (~140 to 160 chars, <= 2 lines each).
   - Secondary experiences (e.g. junior enterprise / older roles): consolidate into AT MOST 2 concise bullet points (~120 to 150 chars each).
   - Align with the target role without fabricating: emphasize workers, automation, data pipelines, APIs, system architecture, and AI/LLM solutions genuinely present in the profile.

6. Strict Anti-Hallucination & Ongoing Studies Rule:
   - Use ONLY tools, companies, projects, and metrics present in the candidate profile.
   - If a job requirement only appears under the candidate's current studies or coursework, cite it explicitly as a current focus of study/aprofundamento, never as consolidated production experience.

7. Strict 1-Page A4 Budget & Exact ID Preservation:
   - Experience: mark 'included: true' for at most 2 to 3 most relevant experiences.
   - Projects: mark 'included: true' for at most 1 to 2 most relevant projects (prioritize AI/LLM or direct stack matches).
   - Education: keep primary degree(s) included.
   - Certificates: keep at most 2 relevant certifications.
   - Selected Skills: select 10 to 12 most job-aligned atomic skills in 'selectedSkills'.
   - MUST preserve exact original 'id' strings from input items!

8. JSON-Only Output & Canonical One-Shot Example:
   - Output EXCLUSIVELY a valid minified JSON object. No markdown (\`\`\`json), no explanations, no verbose deliberation. Ensure the JSON is 100% complete and valid.

CANONICAL ONE-SHOT EXAMPLE:
{"matchScore":88,"matchedKeywords":["TypeScript","Node.js","Docker","APIs REST","Automação","LLMs"],"missingKeywords":["PyTorch","LangChain"],"tailoredTitle":"AI Engineer | Engenharia de Software & IA","tailoredObjective":"Sou desenvolvedor com base sólida em arquitetura backend, automação de processos e infraestrutura Linux com Docker e CI/CD. Desenvolvi APIs escaláveis, pipelines de filas assíncronas e integrações práticas com APIs de LLMs aplicando engenharia de prompts estruturada. Busco unir minha experiência em sistemas distribuídos aos meus estudos atuais em IA generativa para construir soluções de alto impacto no iFood.","experienceCuration":[{"id":"exp-1","included":true,"relevanceScore":96,"tailoredDescription":"• Desenvolvi o portal institucional e APIs REST em Node.js e TypeScript com infraestrutura em servidores Linux e Docker, ampliando a confiabilidade operacional.\\n• Automatizei fluxos assíncronos de processamento de dados e integração de sistemas internos via workers, reduzindo gargalos manuais na operação.\\n• Estruturei pipelines de CI/CD e padronizei rotinas de deploy automatizado em produção, acelerando a entrega contínua de novas funcionalidades."},{"id":"exp-2","included":true,"relevanceScore":84,"tailoredDescription":"• Implementei soluções web full-stack para clientes reais em React e Node.js aplicando metodologias ágeis e revisão técnica em equipe.\\n• Modelei bancos relacionais PostgreSQL e integrei serviços de terceiros garantindo entregas dentro do prazo e escopo acordados."}],"projectCuration":[{"id":"proj-1","included":true,"relevanceScore":95,"tailoredDescription":"• Arquitetei sistema de curadoria inteligente integrado a APIs de LLMs (Gemini e DeepSeek) com processamento assíncrono em BullMQ e Redis."}],"educationCuration":[{"id":"edu-1","included":true,"relevanceScore":90}],"certificateCuration":[{"id":"cert-1","included":true,"relevanceScore":80}],"selectedSkills":["TypeScript","Node.js","Python","Docker","Linux","APIs REST","Redis","BullMQ","PostgreSQL","Integração com LLMs","CI/CD","Git"]}`;

/**
 * Constrói o payload dinâmico do usuário enviando apenas os dados necessários
 * de forma condensada e com IDs explícitos para correspondência 1:1.
 */
export function buildCurationUserPayload(cv: CVData, job: JobCurationInput): string {
    const jobBlock = [
        `TARGET ROLE: ${job.roleTitle.trim()}`,
        job.company ? `TARGET COMPANY: ${job.company.trim()}` : "",
        `JOB DESCRIPTION:\n${job.jobDescription.trim()}`
    ].filter(Boolean).join("\n");

    const candidateProfile = JSON.stringify({
        personal: {
            fullName: cv.personal.fullName,
            currentTitle: cv.personal.title
        },
        objective: cv.objective,
        experience: cv.experience.map(e => ({
            id: e.id,
            company: e.company,
            role: e.role,
            startDate: e.startDate,
            endDate: e.endDate,
            description: e.description
        })),
        projects: (cv.projects || []).map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            description: p.description
        })),
        education: cv.education.map(ed => ({
            id: ed.id,
            institution: ed.institution,
            degree: ed.degree,
            startDate: ed.startDate,
            endDate: ed.endDate,
            description: ed.description
        })),
        certificates: cv.certificates.map(c => ({
            id: c.id,
            name: c.name,
            organization: c.organization,
            date: c.date
        })),
        skills: cv.skills,
        languages: cv.languages
    });

    return `${jobBlock}

CANDIDATE MASTER PROFILE:
${candidateProfile}

Output the complete minified JSON curation in pt-BR following all rules (NO quotes around tech names, rewrite ALL included experiences in 1st person without category prefixes).`;
}

/**
 * Função de retrocompatibilidade para Gemini ou testes existentes
 */
export const CURATION_GEMINI_PROMPT = (cv: CVData, job: JobCurationInput): string =>
    `${CURATION_SYSTEM_PROMPT_EN}\n\n${buildCurationUserPayload(cv, job)}`;
