# Plano de Ação: Configuração no Primeiro Uso (UI Onboarding) & Múltiplos Provedores de IA (Gemini, OpenAI, OpenAPI / 9router)

> [!NOTE]
> O plano anterior de containerização Docker foi salvo na raiz do projeto em [`DOCKER_PLAN.md`](file:///home/dino/Área%20de%20trabalho/vitae-studio/DOCKER_PLAN.md) para aplicação posterior.

---

## 1. Visão Geral e Objetivos

1. **Zero configuração manual de `.env`**: Variáveis de infraestrutura (`API_HOST`, `API_PORT`, `REDIS_HOST`, `REDIS_PORT`, `RESOURCES_DIR`) possuem defaults funcionais no código.
2. **Onboarding no Primeiro Acesso**: Ao abrir a plataforma pela primeira vez, o frontend consulta o estado de configuração na API (`GET /settings`). Se nenhuma chave/provedor estiver configurado, um modal de **Configuração Inicial** é exibido automaticamente para o usuário configurar tudo pela interface.
3. **Suporte Multi-Provedor (Gemini, OpenAI e OpenAPI / 9router)**:
   - **Google Gemini**: Integração nativa via `@google/genai`.
   - **OpenAI**: Integração com a API oficial (`https://api.openai.com/v1`).
   - **OpenAPI / Compatível com OpenAI (ex: 9router, OpenRouter, Groq, Ollama)**: Permite configurar uma **Base URL customizada** (como o endpoint local/remoto do **9router**, ex: `http://localhost:20128/v1`), a **API Key** do 9router e o **Modelo** desejado.

---

## 2. Detalhamento de Implementação

### Etapa 1: Persistência e Gerenciamento de Configurações no Backend (`api`)
- `api/src/modules/settings/settings.model.ts`: Tipos e schemas Zod para `AppSettings` (`gemini`, `openai`, `openai-compatible`).
- `api/src/modules/settings/settings.service.ts`: Persistência híbrida em `resources/settings.json` + Redis (`settings:app`), com fallback retrocompatível para `process.env.GEMINI_API_KEY`.
- `api/src/modules/http/schema/settings.schema.ts`: Schemas Fastify/Zod para `/settings`.
- `api/src/modules/http/controllers/settings.controller.ts`: Endpoints `GET /settings`, `PUT /settings`, `POST /settings/test`, `POST /settings/models`.
- `api/src/modules/http/router.ts` & `api/src/modules/http/index.ts`: Registro de rotas e suporte explícito ao método `PUT` no `@fastify/cors`.

### Etapa 2: Abstração Multi-Provedor de IA (`api/src/modules/enrichment/`)
- `api/src/modules/enrichment/ai/openai-compatible.provider.ts`: Cliente compatível com OpenAI e OpenAPI/9router (`/chat/completions` e `/models`), sanitização de blocos markdown JSON e validação via `enrichedCVSchema`.
- `api/src/modules/enrichment/gemini/gemini.prompt.ts`: Contrato JSON explícito no prompt para compatibilidade universal entre modelos.
- `api/src/modules/enrichment/gemini/gemini.ts` & `gemini.worker.ts`: Dispatcher dinâmico `enrichCVWithAI` lendo configurações em tempo real do `SettingsService`.

### Etapa 3: Interface de Primeiro Acesso e Modal de Configurações no Frontend (`web`)
- `web/src/service/settings.service.ts` & `web/src/hooks/settings.hook.tsx`: Integração HTTP e gerenciamento de estado com `@tanstack/react-query`.
- `web/src/components/settings-modal.component.tsx` & `.css`: Modal de Onboarding e Configuração de IA com suporte a Gemini, OpenAI e OpenAPI/9router (Base URL, API Key, listagem dinâmica de modelos e teste de conexão).
- `web/src/components/navbar.component.tsx`, `web/src/components/enrichment-modal.component.tsx` e `web/src/App.tsx`: Botão de configuração com badge de status na Navbar, abertura automática no 1º acesso e proteção no modal de enriquecimento.
