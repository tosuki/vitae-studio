# Contexto de Desenvolvimento e Arquitetura - MCP API (Vitae Studio)

Este arquivo foi criado para consolidar o estado de desenvolvimento, arquitetura e decisões de design tomadas no projeto, permitindo que agentes de IA recuperem o contexto completo das modificações feitas.

---

## 1. Visão Geral da Arquitetura

O projeto `mcp-api` é um microsserviço desenvolvido em **Node.js (TypeScript)** para a automação de processos de recrutamento e seleção (raspagem de vagas de emprego e otimização/análise de perfis com IA).

### Tecnologias Utilizadas:
* **Core**: Fastify (Servidor HTTP rápido e de baixa sobrecarga)
* **Validação**: Zod (Validação estrita de contratos e variáveis de ambiente)
* **Filas/Workers**: BullMQ + Redis (Processamento de tarefas assíncronas em background)
* **Raspagem (Scraping)**: Puppeteer + Puppeteer-Cluster + Stealth Plugin (Automação de navegadores headless)
* **IA/LLM**: Gemini API (Otimização e análise inteligente)
* **Transpilação/Bundle**: TSX + TSC + Esbuild

---

## 2. Estrutura de Pastas e Componentes

```
mcp-api/
├── src/
│   ├── env.ts                  # Validação estrita de variáveis de ambiente com Zod
│   ├── index.ts                # Ponto de entrada (Servidor HTTP & Graceful Shutdown)
│   ├── browser/
│   │   └── browser.ts          # Encapsula o ciclo de vida do Puppeteer-Cluster
│   ├── error/
│   │   └── error.ts            # Hierarquia tipada de erros e exceções
│   ├── factory/
│   │   └── index.ts            # Container manual de Injeção de Dependências (Singletons)
│   ├── handlers/
│   │   ├── handler.ts          # Contrato genérico para handlers de jobs
│   │   ├── vacancy.ts          # Handler para scraping de vagas de emprego
│   │   └── gemini.ts           # Handler para análise semântica por IA (Gemini)
│   ├── http/
│   │   ├── server.ts           # Configuração do App Fastify
│   │   ├── router.ts           # Definição de rotas HTTP
│   │   ├── error.handler.ts    # Manipulador global de erros HTTP
│   │   ├── controller/
│   │   │   └── task.controller.ts # Controlador de requisições de Jobs/Tasks
│   │   └── schema/
│   │       └── task.schema.ts  # Contratos Zod para validação de payloads HTTP
│   ├── logger/
│   │   └── logger.ts           # Logger centralizado colorido (ANSI)
│   ├── model/
│   │   ├── job.ts              # Modelagem de estado e tipos de jobs
│   │   └── vacancy.ts          # Modelagem de dados estruturados de vagas
│   └── queue/
│       ├── queue.ts            # Gerenciamento de Filas BullMQ e Eventos do Redis
│       └── worker.ts           # Inicialização e monitoramento de Workers em background
```

---

## 3. Implementações Recentes e Decisões de Design

### A. Hierarquia de Erros Customizada (`CoreError`)
Para evitar erros genéricos de runtime (`new Error`), implementamos uma hierarquia fortemente tipada derivada de `CoreError` em [error.ts](file:///Users/tosuki/Documents/Projects/cv/mcp-api/src/error/error.ts):

* **Funcionamento**: A classe `CoreError` herda de `Error` nativo para garantir stack traces completos e compatibilidade de protótipo. Cada erro expõe um código padronizado do tipo `ErrorCode` e um código de status de resposta padrão `statusCode`.
* **Erros de Camadas**:
  * **HTTP/API**: `ValidationError` (400), `TaskNotFoundError` (404), `HttpInternalServerError` (500)
  * **Fila/Redis**: `QueueJobFailedError` (500), `UnsupportedJobTypeError` (400)
  * **Negócio/Handlers**: `InvalidJobStateError` (422), `GeminiAnalysisError` (500)
  * **Infraestrutura/Chrome**: `BrowserNotStartedError` (500), `BrowserExecutionError` (500)

### B. Manipulação de Erros Dinâmica (Princípio Aberto-Fechado)
O manipulador de erros global em [error.handler.ts](file:///Users/tosuki/Documents/Projects/cv/mcp-api/src/http/error.handler.ts) não possui mais árvores condicionais (`if/else`) para mapear tipos de erro para status de resposta.
* **Mecanismo**: Quando um `CoreError` é interceptado, o handler lê dinamicamente `error.statusCode` e responde no formato `{ ok: false, code, message, raw }`. Isso evita modificações no manipulador sempre que um erro novo for criado.
* **Erros do Zod**: Validações malsucedidas do Fastify Type Provider são detectadas e convertidas automaticamente para `ValidationError` (status 400).

### C. Logger Colorido Centralizado (`CentralizedLogger`)
Localizado em [logger.ts](file:///Users/tosuki/Documents/Projects/cv/mcp-api/src/logger/logger.ts), o logger formata as mensagens exibindo data/hora ISO, severidade do log em negrito com cores ANSI exclusivas e parâmetros adjacentes:
* **DEBUG** (Ciano) -> `console.debug`
* **INFO** (Verde) -> `console.info`
* **WARN** (Amarelo) -> `console.warn`
* **ERROR** (Vermelho) -> `console.error`
* **CRITICAL** (Magenta) -> `console.error`

*Observação: Os logs internos do Fastify (requisições HTTP, inicialização interna) continuam usando o logger nativo estruturado do Fastify para preservar telemetria de roteamento.*

### D. Encerramento Suave (Graceful Shutdown)
Implementado no arquivo [index.ts](file:///Users/tosuki/Documents/Projects/cv/mcp-api/src/index.ts) para evitar processos zumbis (Puppeteer) e vazamentos de conexões no Redis quando o servidor for atualizado ou desligado (sinais `SIGINT`/`SIGTERM`):
1. **Desligamento HTTP**: O servidor Fastify para de aceitar conexões e finaliza as atuais através de `app.close()`.
2. **Desligamento de Singletons**: O método `shutdownInstances()` em [factory/index.ts](file:///Users/tosuki/Documents/Projects/cv/mcp-api/src/factory/index.ts) encerra suavemente todos os recursos alocados (desativa os workers, encerra as conexões do BullMQ com o Redis e fecha o cluster do navegador Puppeteer).
3. **Timeout de Segurança**: Há um timer de 10s que força `process.exit(1)` caso o encerramento trave por motivos externos.

---

## 4. Próximos Passos de Desenvolvimento

Se o contexto expirar, considere focar nos seguintes tópicos:
1. **Implementação de Testes Automatizados**: Criar testes unitários para os handlers em `src/handlers/` simulando o comportamento de navegação (`BrowserCluster`) e a API do Gemini.
2. **Integração dos Workers no Startup**: O index.ts atualmente inicia o servidor HTTP, mas não chama explicitamente `getWorkerManagerInstance().startWorker()`. Verifique se o fluxo exige que os Workers rodem sob o mesmo processo ou se serão iniciados em uma instância separada de container.
3. **Persistência de Dados**: O estado do job é mantido temporariamente no Redis pelo BullMQ. Adicionar persistência persistente (ex: PostgreSQL/Prisma) no encerramento de jobs com sucesso/falha pode ser benéfico.
