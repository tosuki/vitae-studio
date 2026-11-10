# Plano de Implementação: Banco Central de Experiências (Master Profile) + Curadoria Inteligente por Vaga

## Objetivo
Evoluir o Vitae Studio da arquitetura 1:1 atual para o modelo desacoplado: **Banco Central de Experiências (Master Profile)** permanente com **Curadoria Inteligente e Toggles por Vaga**, com uma restrição fundamental: **o currículo curado gerado para a vaga deve caber estritamente no espaço de 1 folha A4 (Single-Page Resume)**, maximizando o impacto para ATS com atrito cognitivo mínimo para o usuário.

---

## Regra de Ouro: Restrição de 1 Página A4 (One-Page Constraint)
1. **Curadoria Inteligente Ponderada:** A IA deve selecionar apenas as top 2 a 3 experiências mais fortes, top 1 ou 2 projetos de maior relevância, limitar a 2 ou 3 bullet points enxutos por item e priorizar as competências mais críticas da vaga.
2. **Prevenção de Transbordo (Overflow):** A UI do preview avisará visualmente caso o usuário ative itens demais manualmente que ultrapassem a altura limite de 1 página A4 (1120px / 297mm).
3. **Perfil Mestre Livre:** O Master Profile continua sem qualquer limite de tamanho (o usuário guarda dezenas de itens); apenas a projeção curada para a vaga é compactada para 1 página A4.

---

## 1. Diagnóstico da Arquitetura Atual & Pontos de Acoplamento

1. **Estado Único Acoplado (`CVData` em `web/src/hooks/cv-state.hook.ts`):**
   - Um único objeto `cvData` no `localStorage` sob a chave `cv_builder_data`.
   - Edição, visualização e exportação operam sobre a mesma instância. O usuário não consegue manter histórico completo sem poluir o currículo visual.
2. **Substituição Destrutiva na IA (`web/src/components/enrichment-modal.component.tsx` & `api/src/modules/enrichment`):**
   - A resposta da IA sobrescreve `cvData` por completo (`onApplyEnrichment`), apagando o texto original e impossibilitando comparações ou reversões.
3. **Novas Seções Integradas Recentemente (PR #1):**
   - Foi adicionada a seção **`projects` (Projetos Pessoais / Portfólio)** e o fluxo de **Ingestão de Currículos (PDF/TXT)** via `/tasks/parse-resume`.
   - O plano de curadoria deve obrigatoriamente incluir `projects` na curadoria e alavancar a ingestão de PDF como atalho para popular o Perfil Mestre.
4. **Dependência de Scraping do LinkedIn (`api/src/modules/enrichment/linkedin.worker.ts`):**
   - O fluxo de enriquecimento exige obrigatoriamente um `linkedinJobId` e executa um crawler via Puppeteer, bloqueando vagas de Gupy, Catho, sites de carreiras ou texto copiado/colado diretamente.
5. **Ausência de Metadados de Visibilidade por Item:**
   - As interfaces `ExperienceItem`, `ProjectItem`, `EducationItem`, `CertificateItem` não possuem estados de inclusão/exclusão dinâmica para visualização.

---

## 2. Novo Modelo de Entidades e Fluxo de Dados

### A. Entidades do Frontend (`web/src/types/`)
- `MasterProfile`: Superconjunto de `CVData` atual, contendo todas as experiências, projetos, formações, certificações e competências acumuladas.
- `JobTarget`:
  - `id: string`
  - `roleTitle: string`
  - `company?: string`
  - `jobDescription: string`
  - `targetLength: '1_page' | '2_pages'`
  - `createdAt: number`
- `TargetedCuration`:
  - `jobId: string`
  - `matchScore: number`
  - `matchedKeywords: string[]`
  - `missingKeywords: string[]`
  - `tailoredObjective: string`
  - `experience: Record<string, { included: boolean; tailoredDescription?: string; relevanceScore?: number }>`
  - `projects: Record<string, { included: boolean; tailoredDescription?: string; relevanceScore?: number }>`
  - `education: Record<string, { included: boolean; relevanceScore?: number }>`
  - `certificates: Record<string, { included: boolean; relevanceScore?: number }>`
  - `selectedSkills: string[]`
- `ActiveMode`: `'master_profile' | 'targeted_resume'`

### B. Projeção Reativa para o Preview
`renderedCV = deriveTargetedCV(masterProfile, activeCuration, styleConfig)`:
- O motor de renderização (`CVPreview`) continua recebendo a interface `CVData`, garantindo **zero quebras** nos componentes visuais (`experience-preview`, `projects-preview`, `education-preview`, etc.).

---

## 3. Especificação da API / Services

### A. Endpoint Unificado / Adaptado (`POST /tasks/curate`)
- **Input:**
  - `job`: `{ roleTitle: string; jobDescription: string; targetLength?: '1_page' | '2_pages' }`
  - `profile`: `CVData` (dados do perfil mestre)
- **Fila BullMQ:** Pula o crawler caso o texto da vaga venha preenchido e vai direto para a fila de curadoria LLM.
- **Polling:** Mantém compatibilidade com `GET /tasks/:id` retornando o status e o resultado estruturado (`TargetedCuration`).

---

## 4. Contrato do Prompt e JSON Schema (Curadoria)

A LLM recebe o perfil mestre e o texto da vaga. Ela retorna:
1. `matchScore`: Nota percentual (0 a 100) baseada nos requisitos da vaga.
2. `matchedKeywords` & `missingKeywords`: Listas de tags ATS para feedback visual imediato.
3. `tailoredObjective`: Objetivo profissional enxuto, direcionado para o cargo alvo.
4. `curatedExperiences`: Lista com `id` original, `included` (booleano), `tailoredDescription` (bullet points alinhados com verbos de ação e palavras-chave da vaga) e `relevanceScore` (1-100).
5. `curatedProjects`: Lista com `id` original, `included` (booleano), `tailoredDescription` e `relevanceScore` (1-100).
6. `curatedEducation`: Lista com `id` original e `included`.
7. `curatedCertificates`: Lista com `id` original e `included`.
8. `curatedSkills`: Lista filtrada/ordenada das competências mais relevantes que existem no perfil mestre.

---

## 5. UI/UX: Experiência Simples (Simplicity-First)

1. **Alimentação Ágil do Master Profile:**
   - O usuário pode cadastrar manualmente ou usar o recém-adicionado **Upload de Currículo (PDF/TXT)** para inicializar o Master Profile em segundos.
2. **Seletor de Modo no Topo / Navbar:**
   - `[ Minha Bagagem (Master) ]` | `[ Vagas sob Medida (2) ]`
3. **Modal Simples "Criar Currículo para Vaga":**
   - 2 campos principais: **Cargo Alvo** e **Texto da Vaga** (copiar e colar).
   - Seletor de objetivo de tamanho: `1 Página (Mais conciso)` ou `2 Páginas (Completo)`.
4. **Barra de Curadoria Dinâmica (Targeted Bar):**
   - Badge com **Score de Aderência (ex: 88% Match)** e tags de palavras-chave da vaga.
   - Cada bloco de experiência, projeto, formação e skill exibe um switch/checkbox `[ Ativo no Currículo ]` e badge de afinidade.
   - Alterar qualquer toggle atualiza instantaneamente o preview sem nova requisição à IA.
5. **Exportação Direta:** O botão "Imprimir / PDF" exporta exatamente a visão curada ativa.

---

## 6. Tarefas de Implementação

- [x] Task 1: [Backend] Criar DTO e Schema Zod para curadoria direta de vaga (`POST /tasks/curate` incluindo `experience` e `projects`).
- [x] Task 2: [Backend] Implementar Prompt e Schema Gemini com suporte a Structured Outputs para seleção de IDs e reescrita de bullets de experiências e projetos calibrados para 1 folha A4.
- [x] Task 3: [Backend] Atualizar o fluxo de filas (BullMQ) para processamento imediato sem Puppeteer quando texto da vaga for fornecido.
- [x] Task 4: [Frontend] Modelar tipos de `MasterProfile`, `JobTarget` e `TargetedCuration` em `web/src/types/` (incluindo `projects`).
- [x] Task 5: [Frontend] Criar hook `useMasterProfile` e função pura `deriveTargetedCV` desacoplando dados mestres de dados de renderização.
- [x] Task 6: [Frontend] Conectar o `ResumeUploadModal` para alimentar o `MasterProfile`.
- [x] Task 7: [Frontend] Criar modal de criação de vaga com campos simples (Cargo, Descrição colada, restrição estrita de 1 folha A4).
- [x] Task 8: [Frontend] Adicionar toggles rápidos de visibilidade (incluir/excluir item com 1 clique), alternador de texto IA vs original e badges de aderência.
- [x] Task 9: [Frontend] Integrar seletor de vagas na navbar e indicador de altura A4 em tempo real no preview.
- [x] Task 10: [Validação & Testes] Testes unitários do pipeline de curadoria, schema de retorno da LLM e sincronização reativa com o `CVPreview`.
