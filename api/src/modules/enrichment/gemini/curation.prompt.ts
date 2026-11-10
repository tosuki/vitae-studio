import { CVData } from "../../common/model/cv.model";

export interface JobCurationInput {
    roleTitle: string;
    jobDescription: string;
    company?: string;
}

export const CURATION_GEMINI_PROMPT = (cv: CVData, job: JobCurationInput) => `
Atue como um recrutador executivo e especialista em ATS (Applicant Tracking Systems).
Sua missão é realizar a CURADORIA ESTRATÉGICA do perfil mestre de um candidato para adequá-lo PERFEITAMENTE a uma vaga de emprego, com uma RESTRIÇÃO FUNDAMENTAL:
O currículo final deve caber estritamente em UMA ÚNICA PÁGINA A4 (One-Page Resume).

=== DADOS DA VAGA ===
Cargo Alvo: ${job.roleTitle}
${job.company ? `Empresa: ${job.company}` : ""}
Descrição / Requisitos da Vaga:
${job.jobDescription}

=== PERFIL MESTRE DO CANDIDATO ===
${JSON.stringify({
    personal: cv.personal,
    objective: cv.objective,
    experience: cv.experience,
    projects: cv.projects || [],
    education: cv.education,
    certificates: cv.certificates,
    skills: cv.skills,
    languages: cv.languages
})}

=== DIRETRIZES ESTRITAS PARA CABER EM 1 PÁGINA A4 ===
1. SELEÇÃO DE EXPERIÊNCIAS:
   - Marque 'included: true' para no MÁXIMO as 2 a 3 experiências profissionais mais recentes e relevantes para a vaga. Todas as outras devem ser 'included: false'.
   - Para as experiências selecionadas, gere em 'tailoredDescription' uma versão enxuta e de alto impacto contendo exatamente 2 a 3 bullet points objetivos iniciados por verbos de ação fortes, incorporando palavras-chave técnicas e métricas citadas na vaga (SEM INVENTAR fatos ou ferramentas não mencionadas pelo candidato).

2. SELEÇÃO DE PROJETOS:
   - Marque 'included: true' para no MÁXIMO 1 a 2 projetos que demonstrem competências diretas exigidas pela vaga. Os demais devem ter 'included: false'.
   - Otimize a 'tailoredDescription' do projeto para destacar a stack relevante.

3. FORMAÇÃO E CERTIFICAÇÕES:
   - Mantenha 'included: true' para a formação acadêmica principal (1 ou 2) e para as certificações mais alinhadas.

4. HABILIDADES (SKILLS):
   - Selecione e ordene em 'selectedSkills' as 8 a 12 competências do candidato que têm maior aderência com a vaga.

5. OBJETIVO PROFISSIONAL:
   - Elabore um 'tailoredObjective' conciso (2 a 3 frases) focado no cargo alvo e no valor que o candidato agrega.

6. SCORE E KEYWORDS ATS:
   - Calcule um 'matchScore' realista (inteiro de 0 a 100).
   - Liste as 'matchedKeywords' (termos da vaga presentes no perfil) e 'missingKeywords' (requisitos da vaga ausentes no perfil).

7. PRESERVAÇÃO DE IDs:
   - Para cada item em 'experience', 'projects', 'education' e 'certificates', utilize exatamente o mesmo 'id' recebido no perfil original.

8. FORMATO DE SAÍDA:
   - Retorne EXCLUSIVAMENTE um objeto JSON válido correspondente ao schema especificado.
`;
