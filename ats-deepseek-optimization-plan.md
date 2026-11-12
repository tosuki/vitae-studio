# Plano Técnico de Refatoração: Otimização ATS e Arquitetura de Redução de Tokens (DeepSeek)

## Objetivo
Elevar rigorosamente a qualidade técnica do aperfeiçoamento de currículos para sistemas ATS corporativos (Workday, Greenhouse, Lever, Taleo e Gupy) e reduzir em mais de 75% o consumo de tokens na API do DeepSeek através de Context Caching estático, sanitização local, retorno baseado em diffs e controle dinâmico de tokens.

---

## 1. Relatório de Diagnóstico e Auditoria do Código Atual

### 1.1 Gargalos Críticos de Consumo de Tokens (DeepSeek API)
| Componente / Fluxo | Implementação Atual | Impacto no Custo e Tokens |
|---|---|---|
| **Context Caching (DeepSeek)** | O `system` prompt atual possui apenas 1 ou 2 frases genéricas em português (`"Você é um especialista técnico em ATS..."`). Todas as regras, schemas e dados variáveis ficam misturados no `user` prompt. | **0% de Cache Hit**. O DeepSeek exige um prefixo estático exato de no mínimo 128 tokens no início da requisição. Como o prompt atual varia logo nos primeiros bytes, todo prompt é cobrado a preço cheio de cache miss a cada chamada. |
| **Idioma dos Prompts** | Prompts escritos inteiramente em Português com instruções longas e repetitivas. | **Sobrecarga de 25% a 35% nos tokens de entrada**. O vocabulário BPE (Byte-Pair Encoding) dos modelos base divide palavras em português em múltiplos fragmentos/subwords, enquanto em inglês a densidade semântica por token é substancialmente maior. |
| **Volume de Entrada (Full CV Dump)** | O método `ENRICHMENT_GEMINI_PROMPT` e `CURATION_GEMINI_PROMPT` injeta o currículo completo via `JSON.stringify(cv)`, incluindo dados imutáveis (telefones, emails, redes sociais, histórico escolar antigo, certificações). Além disso, injeta o `rawHtml` bruto da vaga sem remoção de scripts, tags ou menus. | **Desperdício de 2.000 a 6.000 tokens de entrada desnecessários por requisição**, estourando janelas e gerando ruído semântico. |
| **Volume de Saída (Sem Diffs)** | A IA é solicitada a reescrever e devolver o objeto de currículo inteiro (`CVData`), repetindo nomes de empresas, datas, cargos e dados pessoais. | **Gasto excessivo de 1.000 a 1.800 tokens de saída**. Tokens de saída são tipicamente 4x a 8x mais caros e aumentam a latência (tempo de resposta) em 3 a 5 vezes. |
| **Alocação de `max_tokens`** | Inexistente na chamada `postChatCompletionsWithFallback` (utiliza o padrão default do gateway, frequentemente 4.096 tokens). | Risco de respostas prolixas e custos inflacionados caso o modelo entre em loops de geração. |
| **Métricas de Cache Inexistentes** | A aplicação descarta o objeto `usage` retornado pela API da DeepSeek, não monitorando `prompt_cache_hit_tokens` ou `prompt_cache_miss_tokens`. | Impossibilidade de auditar a taxa de acerto do cache e o ROI financeiro das requisições. |

### 1.2 Fraquezas Técnicas no Aperfeiçoamento para ATS
1. **Ausência de Extração Semântica Prévia da Vaga:** A IA recebe a descrição bruta da vaga e o currículo ao mesmo tempo, sem uma etapa local determinística de sanitização e extração de entidades (Hard Skills, Frameworks, Certificações exigidas).
2. **Descrições Passivas e Genéricas:** O prompt atual não força uma fórmula de impacto. O modelo frequentemente gera descrições como *"Atuou na equipe de backend desenvolvendo APIs"*, que pontuam mal em parsers corporativos.
3. **Falta do Padrão Google XYZ + STAR:** Falta exigência estrutural estrita: **"Conquistou [X], mensurado por [Y], realizando [Z]"**.
4. **Risco de Keyword Stuffing ou Alucinação:** Sem regras estritas anti-alucinação, o modelo tende a adicionar tecnologias que a vaga pede mas que o candidato nunca utilizou, o que gera inconsistência ou desclassificação em entrevistas técnicas.

---

## 2. Normas de ATS e Aplicação no Vitae Studio

Com base na arquitetura dos parsers modernos (Workday, Greenhouse, Lever, Taleo e Gupy):

### 2.1 Diretrizes Técnicas por Plataforma
- **Workday (Indexação por NLP e Densidade Paramétrica):** Exige alinhamento exato de termos técnicos (ex: se a vaga pede "PostgreSQL", usar "PostgreSQL" em vez de apenas "banco SQL") inseridos dentro de contexto de entrega, com percentual de match matemático.
- **Greenhouse (Parsing Estruturado e Scorecards de Recrutadores):** Rejeita títulos criativos e fragmentação em colunas. Seções de experiência precisam de marcadores lineares claros com verbos no passado.
- **Lever & Taleo (Parsing Estrito de Entidades):** Necessitam de clareza cronológica (mês/ano), papéis bem definidos e vinculação explícita de ferramentas à ação realizada.
- **Gupy (Mapeamento Direto e Compatibilidade):** Pontua alto quando competências centrais da vaga aparecem tanto no resumo quanto nas realizações práticas recentes.

### 2.2 Framework Google X-Y-Z + STAR Integrado
Cada bullet point de experiência reescrito pela IA deve obedecer obrigatoriamente à fórmula:
$$\text{“Conquistou } [X] \text{, mensurado por } [Y] \text{, realizando } [Z]”$$
- **[X] Resultado Conquistado:** Impacto técnico ou operacional (ex: *"Reduziu a latência p99 das consultas de faturamento"*).
- **[Y] Métrica/Impacto Quantitativo:** Número, percentual ou escala realista (ex: *"em 35%, suportando pico de 15.000 req/s"*).
- **[Z] Ação e Stack Real:** A tecnologia e ação executada (ex: *"mediante implementação de camada de cache distribuído com Redis e refatoração de queries no PostgreSQL"*).

---

## 3. Nova Arquitetura de Economia Extrema de Tokens (DeepSeek)

```
[Entrada: Vaga + CV do Usuário]
         │
         ▼
[1. Pré-Processador & Sanitizador Local (Backend Node.js)]
  ├── Remove HTML/scripts/ruídos da vaga (redução de 80% do texto)
  ├── Extrai termos-chave da vaga via regex/stop-words locais
  ├── Filtra apenas blocos de experiências/projetos selecionados
  └── Monta payload enxuto com IDs: [id] texto original
         │
         ▼
[2. DeepSeek API - Context Caching Maximizado]
  ├── System Prompt: 100% Imutável, em INGLÊS, > 250 tokens (Garante Cache Hit ~90% desconto)
  ├── User Prompt: Cargo alvo + Termos da vaga + IDs dos textos originais
  ├── Configuração: temperature: 0.25, response_format: { type: "json_object" }
  └── max_tokens: Calculado dinamicamente ((itens * 80) + 60)
         │
         ▼
[3. Resposta em Formato Diffs Minificado]
  └── {"diffs": [{"id": "exp-1", "improved": "• Conquistou X..."}, ...]}
         │
         ▼
[4. Mesclagem e Métricas (Backend)]
  ├── Valida e mescla os diffs no CVData sem alterar os demais campos
  └── Registra logs de usage: prompt_cache_hit_tokens vs prompt_cache_miss_tokens
```

---

## 4. Tarefas e Arquivos da Refatoração (Checklist de Implementação)

- [x] **Tarefa 1: Criar Módulo de Sanitização e Pré-Processamento de Texto**
  - **Arquivo novo:** `api/src/modules/enrichment/ats/text-sanitizer.ts`
  - Limpar HTML da vaga (remover tags script, style, navegação, cookies).
  - Sanitizar textos de entrada (eliminar espaços duplicados, quebras consecutivas e caracteres de controle).
  - Extrair keywords essenciais da vaga localmente (eliminando necessidade de a LLM fazer parsing de HTML bruto).
  - **Verificação:** Teste unitário confirmando redução de 80%+ no tamanho da descrição da vaga.

- [x] **Tarefa 2: Criar Prompt de Sistema Canônico Imutável em Inglês para DeepSeek Caching**
  - **Arquivo novo:** `api/src/modules/enrichment/ats/ats-diff.prompt.ts`
  - Criar `ATS_SYSTEM_PROMPT_EN`: prompt estático em inglês com > 250 tokens com instruções de recrutamento técnico, framework Google XYZ, regras anti-alucinação e schema JSON estrito de diffs.
  - Criar função construtora do `user` prompt enxuto contendo apenas o cargo, palavras-chave da vaga e os blocos a otimizar (`[{ id, text }]`).
  - **Verificação:** Conferir se `ATS_SYSTEM_PROMPT_EN` possui mais de 128 tokens e nenhuma interpolação dinâmica.

- [x] **Tarefa 3: Implementar Provedor Especializado DeepSeek com Diffs e Context Caching**
  - **Arquivo modificado:** `api/src/modules/enrichment/ai/openai-compatible.provider.ts`
  - Criar função `optimizeExperiencesWithDeepSeekDiffs(params)`:
    - Envia `messages: [{ role: "system", content: ATS_SYSTEM_PROMPT_EN }, { role: "user", content: userPayload }]`.
    - Configura `temperature: 0.25` e `response_format: { type: "json_object" }`.
    - Calcula `max_tokens` dinamicamente: `Math.min(2048, (items.length * 90) + 100)`.
    - Captura e loga `response.data.usage.prompt_cache_hit_tokens` e `prompt_cache_miss_tokens`.
  - Criar função de merge local que aplica os `diffs` sobre o `CVData` preservando 100% dos metadados originais.
  - **Verificação:** Executar chamada simulada verificando retorno JSON exclusivo de diffs e mesclagem perfeita.

- [x] **Tarefa 4: Integrar Novo Fluxo nos Endpoints e Workers do Backend**
  - **Arquivos modificados:** `api/src/modules/enrichment/gemini/gemini.worker.ts` e `api/src/modules/http/controllers/task.controller.ts`
  - Quando o provedor configurado for OpenAI-compatível/DeepSeek, usar o pipeline de diffs sanitizado.
  - Registrar métricas de tokens no logger da aplicação.
  - **Verificação:** Testes de integração em `api/src/modules/enrichment/ats/ats-diff.test.ts`.

- [x] **Tarefa 5: Suíte de Testes Automatizados de Eficiência e Conformidade**
  - **Arquivo novo:** `api/src/modules/enrichment/ats/ats-diff.test.ts`
  - Validar garantia de formato Google XYZ nos diffs gerados.
  - Validar anti-alucinação (ids preservados, nenhum id fantasma criado).
  - Validar economia de tokens (tamanho de payload reduzido em mais de 75%).
  - **Verificação:** `cd api && npx vitest run src/modules/enrichment/ats/` aprovado com 100%.

---

## 5. Critérios de Sucesso ("Done When")
1. **Redução Comprovada de Tokens:** Consumo de tokens de entrada reduzido de ~4.500 para menos de 900 tokens por requisição; tokens de saída reduzidos de ~1.500 para menos de 300 tokens.
2. **Context Cache Ativo:** Log do DeepSeek registrando `prompt_cache_hit_tokens > 0` a partir da segunda requisição consecutiva.
3. **Qualidade dos Bullets ATS:** 100% das descrições reescritas iniciadas por verbos de ação fortes no passado e com impacto/métrica estruturada (Google XYZ).
4. **Zero Regressão:** Testes existentes e novos do backend rodando com sucesso (`npm run test` e `npm run build`).
