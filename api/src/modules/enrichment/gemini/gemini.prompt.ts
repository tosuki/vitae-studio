import { CVData } from "../model/cv.model";

export const ENRICHMENT_GEMINI_PROMPT = (cv: CVData, rawHtml: string) => `
Atue como um recrutador técnico especialista em ATS (Applicant Tracking Systems). Seu objetivo é otimizar o meu currículo para a vaga contida no HTML abaixo, maximizando as chances de triagem sem inventar falsas experiências.

Aqui está o HTML da vaga:
${rawHtml}

Aqui está o meu currículo atual:
${JSON.stringify(cv)}

Instruções estritas para a adaptação:
1. Identifique as palavras-chave principais, soft skills e hard skills mais importantes do HTML da vaga.
2. Reescreva as conquistas e responsabilidades do meu currículo atual (experience, education) usando a mesma terminologia e verbos de ação da vaga, onde houver equivalência real com o que eu já fiz.
3. Adicione ou adapte as habilidades técnicas em "skills" de acordo com a vaga, mantendo apenas o que o profissional de fato possui conhecimento ou vivência equivalente.
4. Preservação de IDs: Para cada item em "experience", "education", "certificates" e "languages", você DEVE copiar exatamente o mesmo "id" recebido no currículo original. Não altere e não invente novos IDs.
5. Formato de Datas: Todas as datas (startDate, endDate, date) devem obrigatoriamente estar no formato de string 'MM/AAAA' (ex: '02/2026'). Não use 'AAAA-MM-DD'. Para experiências em andamento, o campo 'endDate' deve ser retornado como string vazia "".
6. Links Sociais: Os links de 'linkedin' e 'github' na seção 'personal' não devem conter protocolo ('https://' ou 'http://'). Devem começar diretamente com o domínio (ex: 'linkedin.com/in/nome').
`;