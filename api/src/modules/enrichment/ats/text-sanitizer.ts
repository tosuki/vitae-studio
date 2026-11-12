/**
 * ATS Text Sanitizer & Local NLP Keyword Extraction
 * Responsável por higienizar textos de vagas e currículos, reduzindo drasticamente o
 * consumo de tokens antes do envio para a API da DeepSeek/LLM.
 */

// Stop-words comuns em Português e Inglês para filtrar ruído de vagas
const STOP_WORDS = new Set([
    "de", "a", "o", "que", "e", "do", "da", "em", "um", "para", "é", "com", "não", "uma",
    "os", "no", "se", "na", "por", "mais", "as", "dos", "como", "mas", "foi", "ao", "ele",
    "das", "tem", "à", "seu", "sua", "ou", "ser", "quando", "muito", "há", "nos", "já",
    "está", "eu", "também", "só", "pelo", "pela", "até", "isso", "ela", "entre", "era",
    "depois", "sem", "mesmo", "aos", "ter", "seus", "quem", "nas", "me", "esse", "eles",
    "estão", "você", "tinha", "foram", "essa", "num", "nem", "suas", "meu", "às", "minha",
    "têm", "numa", "pelos", "elas", "havia", "seja", "qual", "será", "nós", "tenho",
    "the", "and", "to", "of", "a", "in", "for", "is", "on", "that", "by", "this", "with",
    "i", "you", "it", "not", "or", "be", "are", "from", "at", "as", "your", "all", "have",
    "new", "more", "an", "was", "we", "will", "home", "can", "us", "about", "if", "page",
    "my", "has", "search", "free", "but", "our", "one", "other", "do", "no", "information",
    "time", "they", "site", "he", "up", "may", "what", "which", "their", "vaga", "trabalho",
    "requisitos", "desejável", "diferencial", "empresa", "benefícios", "atividades", "regime",
    "contratação", "horário", "clt", "pj", "anos", "experiência", "dia", "dias", "semana",
    "sobre", "somos", "nossa", "nosso", "fazer", "fará", "você", "procuramos", "buscamos",
    "candidato", "inscrição", "equipe", "time", "ambiente", "oportunidade", "local"
]);

/**
 * Remove HTML tags, scripts, estilos, comentários e ruídos de marcação.
 * Converte HTML bruto do LinkedIn em texto limpo e conciso.
 */
export function cleanJobDescription(rawHtmlOrText: string): string {
    if (!rawHtmlOrText || typeof rawHtmlOrText !== "string") {
        return "";
    }

    let text = rawHtmlOrText;

    // Se parecer HTML, aplica remoção profunda de tags
    if (text.includes("<") && text.includes(">")) {
        text = text
            // Remove scripts, styles, svgs e iframes inteiros
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
            .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
            .replace(/<!--[\s\S]*?-->/g, " ")
            // Converte quebras de bloco e listas em newlines
            .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|tr|section)>/gi, "\n")
            .replace(/<br\s*\/?>/gi, "\n")
            // Remove todas as demais tags HTML
            .replace(/<[^>]+>/g, " ");
    }

    // Decodifica entidades HTML comuns
    text = text
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Remove caracteres de controle e ruídos de encoding
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // Normaliza espaços múltiplos e quebras de linha consecutivas
    text = text
        .split("\n")
        .map(line => line.replace(/[ \t]+/g, " ").trim())
        .filter(line => line.length > 0)
        .join("\n");

    // Limita o tamanho máximo de segurança (evita estourar contexto mesmo com descrições gigantes)
    // 4.000 caracteres de texto puro representam ~800 tokens, mais que suficiente para descrever qualquer vaga
    const MAX_JOB_TEXT_CHARS = 4000;
    if (text.length > MAX_JOB_TEXT_CHARS) {
        text = text.slice(0, MAX_JOB_TEXT_CHARS) + "\n[Texto da vaga truncado para síntese de requisitos]";
    }

    return text.trim();
}

/**
 * Extrai determinística e localmente as palavras-chave técnicas e substantivos mais relevantes da vaga.
 * Evita que a LLM gaste tokens tentando catalogar keywords óbvias.
 */
export function extractJobKeywords(cleanedText: string, maxKeywords = 15): string[] {
    if (!cleanedText) return [];

    // Captura termos técnicos com caracteres comuns (ex: C++, C#, .NET, Node.js, CI/CD, React.js)
    const tokens = cleanedText
        .toLowerCase()
        .replace(/[^\w\s\+\#\.\-\/]/g, " ")
        .split(/\s+/)
        .map(t => t.replace(/^[.\-\/]+|[.\-\/]+$/g, "").trim())
        .filter(t => t.length >= 2 && !STOP_WORDS.has(t));

    const frequencyMap = new Map<string, number>();
    for (const token of tokens) {
        frequencyMap.set(token, (frequencyMap.get(token) || 0) + 1);
    }

    return Array.from(frequencyMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxKeywords)
        .map(([word]) => word);
}

/**
 * Sanitiza o texto de experiências e projetos do candidato antes de montar o payload.
 */
export function sanitizeResumeText(text: string): string {
    if (!text || typeof text !== "string") return "";
    return text
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/**
 * Calcula o max_tokens ideal para a resposta de Diffs.
 * Cada diff otimizado em formato Google XYZ consome cerca de 60-80 tokens.
 */
export function calculateDynamicMaxTokens(itemsCount: number): number {
    const safeCount = Math.max(1, itemsCount);
    // Fórmula: (itens * 85) + 100 de folga para a estrutura JSON
    const estimated = (safeCount * 85) + 100;
    return Math.min(2048, Math.max(300, estimated));
}
