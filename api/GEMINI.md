# Guia de Desenvolvimento do Projeto (GEMINI.md)

Este documento foi gerado para orientar desenvolvedores e agentes de IA sobre a arquitetura, estrutura e pendências do projeto. O objetivo deste microsserviço é gerenciar tarefas assíncronas de raspagem de dados (ex: LinkedIn) e integração com a API do Gemini, utilizando filas distribuídas.

---

## 🚀 Visão Geral do Projeto

Este é o componente de **API/Back-end** do projeto. Ele foi projetado para:
1. Receber requisições HTTP via **Fastify**.
2. Gerenciar e processar tarefas em segundo plano (background jobs) usando **BullMQ** com **Redis**.
3. Realizar web scraping de perfis do LinkedIn de forma anônima e resiliente com **Puppeteer Cluster** e **Stealth Mode**.
4. Integrar com o **Google Gemini** para processamento e formatação inteligente de dados extraídos de currículos.

---

## 🛠️ Stack Tecnológica

O projeto utiliza as seguintes tecnologias no ecossistema Node.js / TypeScript:

- **Runtime & Compilação**: [TypeScript](https://www.typescriptlang.org/) (v6) + [esbuild](https://esbuild.github.io/) para empacotamento rápido.
- **Servidor HTTP**: [Fastify](https://fastify.dev/) para rotas de alta performance com baixo overhead.
- **Banco de Dados / ORM**: [Prisma](https://www.prisma.io/) (instalado como dependência de desenvolvimento, mas ainda não configurado).
- **Validação**: [Zod](https://zod.dev/) para validação rigorosa de variáveis de ambiente e payloads.
- **Filas & Jobs**: [BullMQ](https://bullmq.io/) para gerenciamento de filas baseado em **Redis**.
- **Scraping**: [Puppeteer](https://pptr.dev/) com [puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster) e [puppeteer-extra-plugin-stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) para evitar detecção.
- **Logs**: [Pino](https://getpino.io/) com `pino-pretty` para logs rápidos e legíveis.
- **Testes**: [Vitest](https://vitest.dev/) para testes unitários e de integração.

---

## 📂 Estrutura de Diretórios

A estrutura do projeto está organizada sob a pasta [src](file:///Users/tosuki/Documents/Projects/cv/api/src) da seguinte forma:

```bash
api/
├── dist/                          # Código transpilado de produção
├── src/
│   ├── cluster/
│   │   └── BrowserCluster.ts      # Gerenciamento do cluster Puppeteer
│   ├── handler/
│   │   ├── LinkedinRawTextHandler.ts # Handler para extração de texto do LinkedIn
│   │   └── TaskHandler.ts         # Interface base de manipuladores de tarefas
│   ├── http/
│   │   ├── router.ts              # Definição de rotas HTTP do Fastify
│   │   └── server.ts              # Inicialização do servidor Fastify
│   ├── model/
│   │   └── Task.ts                # Definições de tipos de tarefas (TaskState, TaskType)
│   ├── models/
│   │   └── jobs.ts                # Metadados de jobs aceitos pela API (ApiJobMetadata)
│   ├── queue/
│   │   └── manager.ts             # Interface e impl de gerenciamento de filas (BullMQ)
│   ├── env.ts                     # Validação e exportação de variáveis de ambiente com Zod
│   ├── index.ts                   # Ponto de entrada da aplicação
│   └── logger.ts                  # Configuração do logger Pino
├── .env.example                   # Exemplo de configuração de variáveis de ambiente
├── esbuild.config.mjs            # Script de build de produção com esbuild (ESM)
├── package.json                   # Dependências e scripts npm
└── tsconfig.json                  # Configuração do TypeScript (incluindo skipLibCheck: true)
```

---

## ⚙️ Variáveis de Ambiente

As configurações da aplicação são gerenciadas por variáveis de ambiente, validadas em tempo de inicialização no arquivo [env.ts](file:///Users/tosuki/Documents/Projects/cv/api/src/env.ts).

| Variável | Tipo | Padrão | Descrição |
|---|---|---|---|
| `API_HOST` | `string` | `127.0.0.1` | IP de escuta da API Fastify |
| `API_PORT` | `number` | `3000` | Porta de escuta da API Fastify |
| `REDIS_HOST` | `string` | `127.0.0.1` | Host de conexão do Redis para o BullMQ |
| `REDIS_PORT` | `number` | `6379` | Porta de conexão do Redis |

> [!IMPORTANT]
> Se qualquer variável numérica (`API_PORT` ou `REDIS_PORT`) for passada como um valor não-numérico, a aplicação disparará um erro de validação Zod e encerrará imediatamente com código de erro `1`.

---

## 🧠 Decisões de Arquitetura & Estratégias

### 1. Limitação de Taxa do Gemini (Rate Limiting)
Conforme documentado em [manager.ts](file:///Users/tosuki/Documents/Projects/cv/api/src/queue/manager.ts):
- A aplicação foi pensada para utilizar o **tier gratuito do Gemini**, que possui um limite restrito de **5 requisições por minuto**.
- Para solucionar isso, o processamento deve ser controlado por uma fila dedicada onde:
  - Garantimos que **não ocorra processamento paralelo** (concorrência de jobs no Worker = 1).
  - É adicionado um atraso (delay/rate-limiter) entre o processamento de tarefas do Gemini para evitar estouro do limite de requisições por minuto (RPM).

### 2. Puppeteer Stealth & Concorrência
- O gerenciamento das instâncias do navegador é centralizado na classe [BrowserCluster](file:///Users/tosuki/Documents/Projects/cv/api/src/cluster/BrowserCluster.ts).
- Usamos o `puppeteer-extra-plugin-stealth` para mascarar automações contra detecções de scraping.
- A concorrência máxima padrão do cluster está configurada para `2` utilizando o modo de concorrência por página (`Cluster.CONCURRENCY_PAGE`), minimizando o consumo de RAM no servidor.

---

## ⚠️ Bugs e Pendências Identificados

Durante a análise do código atual, foram localizados os seguintes pontos que necessitam de correção e implementação:

### 1. Bug Crítico de Recursão Infinita em `BrowserCluster.ts`
No arquivo [BrowserCluster.ts](file:///Users/tosuki/Documents/Projects/cv/api/src/cluster/BrowserCluster.ts#L48-L53):
```typescript
async close() {
    if (this.cluster === null)
        return

    await this.close() // <-- ERRO: Chama recursivamente a si mesmo causando Stack Overflow!
}
```
* **Correção recomendada:** Alterar para `await this.cluster.close()`.

### 2. Implementação Pendente do `QueueManagerImpl`
O arquivo [manager.ts](file:///Users/tosuki/Documents/Projects/cv/api/src/queue/manager.ts#L18-L26) possui apenas placeholders que disparam erros:
```typescript
export class QueueManagerImpl implements QueueManager {
    createJob(kind: ApiJobMetadata["kind"], data: ApiJobMetadata): Promise<BullJob> {
        throw new Error("Method not implemented.")
    }

    getJob(id: Required<BullJob["id"]>): Promise<BullJob> {
        throw new Error("Method not implemented.")
    }
}
```
* **Necessidade:** Instanciar as instâncias de `Queue` e `Worker` do BullMQ, configurando a conexão do Redis obtida do [env.ts](file:///Users/tosuki/Documents/Projects/cv/api/src/env.ts).

### 3. Implementação do Handler do LinkedIn
O [LinkedinRawTextHandler.ts](file:///Users/tosuki/Documents/Projects/cv/api/src/handler/LinkedinRawTextHandler.ts#L4-L8) está mockado:
```typescript
export class LinkedinRawTextHandler implements TaskHandler {
    async handle(job: Job): Promise<unknown> {
        return 2;
    }
}
```
* **Necessidade:** Usar o `BrowserCluster` para abrir a página do LinkedIn informada na URL da tarefa, extrair as informações textuais do perfil e retornar o resultado.

### 4. Configuração do Prisma
O ORM Prisma está listado no `package.json` mas a aplicação ainda não possui arquivo `prisma/schema.prisma` nem migrations criadas para armazenar o estado das tarefas (`TaskState`).

---

## 🛠️ Scripts Disponíveis

Você pode executar os seguintes comandos a partir da raiz do projeto:

- `npm run dev`: Executa a API localmente no modo de desenvolvimento usando `tsx`.
- `npm run dev:debug`: Executa com nível de log em `debug`.
- `npm run build`: Valida os tipos TypeScript (`tsc`) e compila o código gerando o pacote em `dist/index.js` usando esbuild.
- `npm run start`: Executa o código compilado de produção.
- `npm run test`: Executa os testes automatizados utilizando o Vitest.

---

## 🔧 Correções Realizadas Recentemente

1. **Correção do Build TypeScript (`skipLibCheck`)**: O compilador TypeScript (`tsc`) falhava ao validar as declarações de tipo do pacote externo `puppeteer-extra`. Foi adicionado `"skipLibCheck": true` no [tsconfig.json](file:///Users/tosuki/Documents/Projects/cv/api/tsconfig.json) para contornar esta incompatibilidade externa e permitir o build bem-sucedido.
2. **Resolução de Avisos do Node (`esbuild.config.mjs`)**: Para evitar os avisos de tipo de módulo comum do Node.js sobre o arquivo de configuração do esbuild usar sintaxe ESM (`import`), renomeamos o arquivo de `esbuild.config.js` para `esbuild.config.mjs` e atualizamos o script de build correspondente no [package.json](file:///Users/tosuki/Documents/Projects/cv/api/package.json).

