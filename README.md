# 🌟 Vitae Studio — Construtor de Currículos Profissional e AI Tailoring

O **Vitae Studio** é um ecossistema completo para a criação e otimização de currículos profissionais. Ele é estruturado como um monorepo composto por um frontend interativo e uma API de suporte para análise inteligente de vagas.

---

## 📸 Demonstração da Plataforma (Frontend)

![Vitae Studio Preview](./web/preview.gif)

---

## 📂 Estrutura do Monorepo

O projeto está dividido em duas partes principais:

### 1. 🌐 [Frontend (web)](./web)
Interface de usuário construída em **React 19, TypeScript e Vite** com **CSS Vanilla**.
* **Visualização WYSIWYG**: Renderiza uma prévia A4 perfeita em tempo real.
* **Barra Lateral Ajustável**: Sidebar de formulários redimensionável (Drag-to-Resize).
* **Temas e Estilos**: Customização dinâmica de cores, tipografia e espaçamentos.
* **Modais Customizados**: Interface livre de pop-ups nativos do navegador (`alert`/`confirm`).
* **Exportação Otimizada**: Impressão limpa via `@media print` para gerar PDFs A4 perfeitamente formatados.

### 2. ⚡ [Backend API (mcp-api)](./mcp-api)
API REST de apoio desenvolvida em **Node.js, TypeScript e Fastify** para processamento de tarefas em segundo plano (Jobs).
* **Fila de Processamento**: Gerenciada com **Redis** e **BullMQ** para rodar tarefas assíncronas em segundo plano sem travar o cliente.
* **LinkedIn Scraping**: Extração automatizada de informações de vagas de emprego usando **Puppeteer** em modo *Stealth*.
* **Otimização com IA (AI Tailoring)**: Integração com o **Google Gemini API** para analisar o currículo atual do usuário, calcular a taxa de compatibilidade (*match score*) com uma vaga específica e sugerir adaptações detalhadas de resumo e experiências.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* **Node.js** (v18 ou superior recomendado).
* **Redis** instalado e rodando em sua máquina (necessário para a fila de tarefas da API).

---

### Executando o Frontend (`web`)

1. Navegue até a pasta do frontend:
   ```bash
   cd web
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. O frontend estará disponível no endereço indicado no terminal (geralmente `http://localhost:5173`).

---

### Executando o Backend (`mcp-api`)

1. Garanta que o serviço do **Redis** esteja ativo:
   ```bash
   # No macOS com Homebrew:
   brew services start redis
   ```
2. Navegue até a pasta do backend:
   ```bash
   cd mcp-api
   ```
3. Instale as dependências recomendadas (veja o [PROJECT_SPEC.md](./mcp-api/PROJECT_SPEC.md) para detalhes):
   ```bash
   npm install
   ```
4. Crie um arquivo `.env` contendo suas credenciais de ambiente (como a `GEMINI_API_KEY`).
5. Execute a API e o worker em modo de desenvolvimento.

---

## 📖 Documentação Adicional

* Para ler sobre as especificações técnicas da API, roteamento e integração com o Gemini, consulte o [PROJECT_SPEC.md](./mcp-api/PROJECT_SPEC.md).
* Para detalhes mais profundos sobre as decisões de design e comportamento do editor, consulte o [README.md](./web/README.md) do frontend.
