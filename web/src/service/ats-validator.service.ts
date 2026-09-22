import { CVData } from '../types/cv.model';
import {
  AtsCategory,
  AtsCheckItem,
  AtsReport,
  AtsJobMatchResult,
  AtsRating
} from '../types/ats.model';

// Strong action verbs commonly parsed and favored by ATS in Portuguese and English
const ACTION_VERBS = [
  'desenvolveu', 'desenvolver', 'implementou', 'implementar', 'liderou', 'liderar',
  'otimizou', 'otimizar', 'criou', 'criar', 'gerenciou', 'gerenciar', 'reduziu', 'reduzir',
  'aumentou', 'aumentar', 'arquitetou', 'arquitetar', 'coordenou', 'coordenar',
  'automatizou', 'automatizar', 'integrou', 'integrar', 'elaborou', 'elaborar',
  'estruturou', 'estruturar', 'projetou', 'projetar', 'conduziu', 'conduzir',
  'configurou', 'configurar', 'alcançou', 'alcançar', 'planejou', 'planejar',
  'transformou', 'transformar', 'reestruturou', 'supervisionou', 'modernizou',
  'developed', 'implemented', 'led', 'optimized', 'managed', 'created', 'built',
  'architected', 'reduced', 'increased', 'automated', 'engineered', 'delivered'
];

// Stop words to exclude during job description matching
const STOP_WORDS = new Set([
  'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma',
  'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele',
  'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já',
  'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era',
  'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles',
  'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha',
  'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho',
  'the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with',
  'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'have',
  'new', 'more', 'an', 'was', 'we', 'will', 'home', 'can', 'us', 'about', 'if', 'page',
  'my', 'has', 'search', 'free', 'but', 'our', 'one', 'other', 'do', 'no', 'information',
  'time', 'they', 'site', 'he', 'up', 'may', 'what', 'which', 'their', 'vaga', 'trabalho',
  'requisitos', 'desejável', 'diferencial', 'empresa', 'benefícios', 'atividades', 'regime',
  'contratação', 'horário', 'clt', 'pj', 'anos', 'experiência', 'dia', 'dias', 'semana'
]);

export function validateCVForATS(cvData: CVData): AtsReport {
  const checks: AtsCheckItem[] = [];

  // ==========================================
  // 1. ESTRUTURA & LAYOUT (Total: 20 pts)
  // ==========================================
  const isAtsTheme = cvData.style.theme === 'ats';
  checks.push({
    id: 'layout-theme',
    category: 'layout',
    title: 'Layout de Coluna Única (Single-Column)',
    description: isAtsTheme
      ? 'O currículo está usando a estrutura padrão ATS linear em coluna única, garantindo 100% de precisão na leitura sequencial dos robôs.'
      : 'O currículo está em um layout com possíveis colunas paralelas ou grids duplas, o que pode fragmentar a leitura em parsers de ATS mais antigos.',
    severity: isAtsTheme ? 'success' : 'warning',
    passed: isAtsTheme,
    scoreImpact: 12,
    scoreEarned: isAtsTheme ? 12 : 5,
    suggestion: isAtsTheme
      ? undefined
      : 'Ative o "Padrão ATS" para garantir que todas as seções fluam linearmente de cima para baixo.',
    autoFixAvailable: !isAtsTheme
  });

  const hasTitle = Boolean(cvData.personal.title && cvData.personal.title.trim().length > 2);
  checks.push({
    id: 'layout-target-title',
    category: 'layout',
    title: 'Título de Cargo / Cargo Alvo Definido',
    description: hasTitle
      ? `Cargo alvo claramente identificado: "${cvData.personal.title}".`
      : 'Nenhum cargo ou especialidade foi definido no cabeçalho. Sistemas ATS usam o cargo no topo para indexar o perfil.',
    severity: hasTitle ? 'success' : 'critical',
    passed: hasTitle,
    scoreImpact: 8,
    scoreEarned: hasTitle ? 8 : 0,
    suggestion: hasTitle ? undefined : 'Adicione um cargo claro e objetivo logo abaixo do seu nome (ex: "Desenvolvedor Frontend Senior").'
  });

  // ==========================================
  // 2. DADOS DE CONTATO & IDENTIFICAÇÃO (Total: 18 pts)
  // ==========================================
  const fullNameTrim = cvData.personal.fullName?.trim() || '';
  const hasFullName = fullNameTrim.includes(' ') && fullNameTrim.length >= 5;
  checks.push({
    id: 'contact-name',
    category: 'contact',
    title: 'Nome Completo Identificável',
    description: hasFullName
      ? 'Nome e sobrenome devidamente informados.'
      : 'Informe seu nome e sobrenome completos. Nomes isolados podem ser rejeitados por sistemas cadastrais.',
    severity: hasFullName ? 'success' : 'critical',
    passed: hasFullName,
    scoreImpact: 4,
    scoreEarned: hasFullName ? 4 : 0,
    suggestion: hasFullName ? undefined : 'Preencha seu nome e pelo menos um sobrenome no cabeçalho.'
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasValidEmail = Boolean(cvData.personal.email && emailRegex.test(cvData.personal.email.trim()));
  checks.push({
    id: 'contact-email',
    category: 'contact',
    title: 'E-mail Válido para Contato',
    description: hasValidEmail
      ? 'E-mail em formato padrão reconhecido pelos parsers.'
      : 'E-mail ausente ou com formato incorreto. Parsers ATS usam o e-mail como chave primária do candidato.',
    severity: hasValidEmail ? 'success' : 'critical',
    passed: hasValidEmail,
    scoreImpact: 4,
    scoreEarned: hasValidEmail ? 4 : 0,
    suggestion: hasValidEmail ? undefined : 'Insira um endereço de e-mail válido (ex: seu.nome@email.com).'
  });

  const phoneDigits = (cvData.personal.phone || '').replace(/\D/g, '');
  const hasValidPhone = phoneDigits.length >= 10;
  checks.push({
    id: 'contact-phone',
    category: 'contact',
    title: 'Telefone com DDD / Código de Área',
    description: hasValidPhone
      ? 'Telefone de contato estruturado com DDD.'
      : 'Número de telefone ausente ou muito curto. Recrutadores e ATS filtram candidatos com contato direto.',
    severity: hasValidPhone ? 'success' : 'warning',
    passed: hasValidPhone,
    scoreImpact: 4,
    scoreEarned: hasValidPhone ? 4 : 0,
    suggestion: hasValidPhone ? undefined : 'Forneça seu telefone com DDD (ex: (11) 98765-4321).'
  });

  const hasLocation = Boolean(cvData.personal.location && cvData.personal.location.trim().length >= 4);
  checks.push({
    id: 'contact-location',
    category: 'contact',
    title: 'Localização (Cidade e Estado)',
    description: hasLocation
      ? `Localização definida: "${cvData.personal.location}".`
      : 'Localização não informada. Filtros geográficos de ATS descartam automaticamente currículos sem cidade/estado.',
    severity: hasLocation ? 'success' : 'critical',
    passed: hasLocation,
    scoreImpact: 4,
    scoreEarned: hasLocation ? 4 : 0,
    suggestion: hasLocation ? undefined : 'Adicione Cidade e Estado (ex: "São Paulo, SP" ou "Remoto / Curitiba, PR").'
  });

  const hasSocial = Boolean(cvData.personal.linkedin || cvData.personal.github);
  checks.push({
    id: 'contact-links',
    category: 'contact',
    title: 'Perfil Profissional (LinkedIn ou GitHub)',
    description: hasSocial
      ? 'Link profissional configurado.'
      : 'Nenhum perfil do LinkedIn ou GitHub configurado. Isso reduz a credibilidade e pontuação do perfil.',
    severity: hasSocial ? 'success' : 'warning',
    passed: hasSocial,
    scoreImpact: 2,
    scoreEarned: hasSocial ? 2 : 0,
    suggestion: hasSocial ? undefined : 'Adicione o endereço do seu LinkedIn (ex: linkedin.com/in/seuperfil).'
  });

  // ==========================================
  // 3. RESUMO / OBJETIVO PROFISSIONAL (Total: 14 pts)
  // ==========================================
  const objectiveText = cvData.objective ? cvData.objective.trim() : '';
  const wordCount = objectiveText ? objectiveText.split(/\s+/).filter(Boolean).length : 0;
  const hasObjective = wordCount >= 20;

  checks.push({
    id: 'summary-presence',
    category: 'summary',
    title: 'Presença de Resumo Profissional',
    description: hasObjective
      ? `Resumo presente com ${wordCount} palavras.`
      : 'Resumo ausente ou excessivamente breve. O resumo é a primeira seção escaneada por palavras-chave.',
    severity: hasObjective ? 'success' : 'critical',
    passed: hasObjective,
    scoreImpact: 6,
    scoreEarned: hasObjective ? 6 : (wordCount > 0 ? 2 : 0),
    suggestion: hasObjective ? undefined : 'Escreva um resumo de 3 a 5 linhas destacando suas principais especialidades e conquistas.'
  });

  const isOptimalLength = wordCount >= 30 && wordCount <= 140;
  checks.push({
    id: 'summary-length',
    category: 'summary',
    title: 'Extensão Ideal do Resumo (30 a 140 palavras)',
    description: isOptimalLength
      ? 'Tamanho excelente para leitura por máquina e humana sem cansar o recrutador.'
      : wordCount > 140
        ? `Resumo muito longo (${wordCount} palavras). Parsers priorizam concisão.`
        : `Resumo um pouco curto (${wordCount} palavras).`,
    severity: isOptimalLength ? 'success' : 'warning',
    passed: isOptimalLength,
    scoreImpact: 4,
    scoreEarned: isOptimalLength ? 4 : (hasObjective ? 2 : 0),
    suggestion: isOptimalLength ? undefined : 'Mantenha o resumo entre 30 e 140 palavras concentrando-se nas suas maiores competências.'
  });

  // Check for excessive first-person pronouns (eu, meu, minha)
  const firstPersonRegex = /\b(eu|meu|minha|meus|minhas|comigo)\b/gi;
  const firstPersonMatches = objectiveText.match(firstPersonRegex) || [];
  const isNeutralTone = firstPersonMatches.length === 0;
  checks.push({
    id: 'summary-tone',
    category: 'summary',
    title: 'Tom Profissional e Terceira Pessoa / Neutro',
    description: isNeutralTone
      ? 'Tom profissional e neutro, sem pronomes excessivos de primeira pessoa.'
      : `Detectamos pronomes de primeira pessoa (${firstPersonMatches.slice(0, 3).join(', ')}). ATS e recrutadores preferem tom neutro e objetivo.`,
    severity: isNeutralTone ? 'success' : 'warning',
    passed: isNeutralTone,
    scoreImpact: 4,
    scoreEarned: isNeutralTone ? 4 : 1,
    suggestion: isNeutralTone ? undefined : 'Evite pronomes como "eu fiz" ou "meu objetivo". Prefira verbos de ação diretos e tom neutro.'
  });

  // ==========================================
  // 4. EXPERIÊNCIAS & IMPACTO (Total: 26 pts)
  // ==========================================
  const experienceCount = cvData.experience?.length || 0;
  const hasExperience = experienceCount > 0;
  checks.push({
    id: 'exp-presence',
    category: 'experience',
    title: 'Histórico de Experiência Profissional',
    description: hasExperience
      ? `${experienceCount} experiência(s) cadastrada(s).`
      : 'Nenhuma experiência profissional cadastrada. Sistemas ATS desqualificam currículos sem histórico de atuação.',
    severity: hasExperience ? 'success' : 'critical',
    passed: hasExperience,
    scoreImpact: 6,
    scoreEarned: hasExperience ? 6 : 0,
    suggestion: hasExperience ? undefined : 'Adicione pelo menos uma experiência profissional ou projeto relevante.'
  });

  // Check for bullet points in experiences
  let bulletPointEntries = 0;
  const allExperienceText: string[] = [];

  cvData.experience?.forEach((exp) => {
    if (!exp.description) return;
    allExperienceText.push(exp.description);
    const lines = exp.description.split('\n');
    const hasBullets = lines.some((l) => {
      const trimmed = l.trim();
      return trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*');
    });
    if (hasBullets) bulletPointEntries++;
  });

  const usesBulletPoints = experienceCount > 0 && bulletPointEntries >= Math.ceil(experienceCount / 2);
  checks.push({
    id: 'exp-bullets',
    category: 'experience',
    title: 'Uso de Marcadores (Bullet Points)',
    description: usesBulletPoints
      ? 'Experiências organizadas em tópicos, facilitando a extração de responsabilidades e conquistas.'
      : 'Experiências escritas em blocos corridos de texto. Parsers ATS têm dificuldade em separar realizações de blocos densos.',
    severity: usesBulletPoints ? 'success' : 'warning',
    passed: usesBulletPoints,
    scoreImpact: 6,
    scoreEarned: usesBulletPoints ? 6 : (hasExperience ? 2 : 0),
    suggestion: usesBulletPoints ? undefined : 'Formate as realizações da experiência com marcadores iniciando com "-" ou "•".'
  });

  // Detect Action Verbs
  const combinedExpText = allExperienceText.join(' ').toLowerCase();
  const detectedActionVerbs: string[] = [];
  ACTION_VERBS.forEach((verb) => {
    const regex = new RegExp(`\\b${verb}\\b`, 'i');
    if (regex.test(combinedExpText) && !detectedActionVerbs.includes(verb)) {
      detectedActionVerbs.push(verb);
    }
  });

  const hasStrongActionVerbs = detectedActionVerbs.length >= 3;
  checks.push({
    id: 'exp-action-verbs',
    category: 'experience',
    title: 'Verbos de Ação Assertivos',
    description: hasStrongActionVerbs
      ? `Detectamos ${detectedActionVerbs.length} verbos de ação fortes (${detectedActionVerbs.slice(0, 4).join(', ')}...).`
      : `Detectamos apenas ${detectedActionVerbs.length} verbo(s) de ação forte. ATS valorizam verbos no início de tópicos.`,
    severity: hasStrongActionVerbs ? 'success' : 'warning',
    passed: hasStrongActionVerbs,
    scoreImpact: 8,
    scoreEarned: hasStrongActionVerbs ? 8 : (detectedActionVerbs.length > 0 ? 4 : 0),
    suggestion: hasStrongActionVerbs
      ? undefined
      : 'Inicie os tópicos de experiência com verbos como "Desenvolveu", "Otimizou", "Liderou", "Implementou" ou "Criou".'
  });

  // Detect Metrics and Quantifiable Results (% or numbers or financial)
  const metricRegex = /(\d+[\.,]?\d*\s*%|\b\d{2,}\b|r\$\s*\d+|\$\s*\d+|\b\d+\s*(anos|meses|usuários|projetos|clientes|equipes|milhões|k)\b)/gi;
  const detectedMetrics = combinedExpText.match(metricRegex) || [];
  const uniqueMetrics = Array.from(new Set(detectedMetrics)).slice(0, 8);
  const hasMetrics = uniqueMetrics.length >= 2;

  checks.push({
    id: 'exp-metrics',
    category: 'experience',
    title: 'Resultados Quantificáveis & Métricas',
    description: hasMetrics
      ? `Excelentes métricas encontradas: ${uniqueMetrics.slice(0, 3).join(', ')}.`
      : 'Poucas ou nenhuma métrica numérica identificada (ex: percentuais, volume de usuários, redução de custos).',
    severity: hasMetrics ? 'success' : 'warning',
    passed: hasMetrics,
    scoreImpact: 6,
    scoreEarned: hasMetrics ? 6 : (uniqueMetrics.length === 1 ? 3 : 0),
    suggestion: hasMetrics
      ? undefined
      : 'Inclua métricas e números concretos (ex: "redução de 40% no tempo de carregamento", "equipe de 8 desenvolvedores").'
  });

  // ==========================================
  // 5. HABILIDADES & PALAVRAS-CHAVE (Total: 14 pts)
  // ==========================================
  const rawSkills = cvData.skills || [];
  const cleanSkills = rawSkills.map((s) => s.trim()).filter((s) => s.length > 0);
  const uniqueSkills = Array.from(new Set(cleanSkills));
  const hasMinSkills = uniqueSkills.length >= 6;

  checks.push({
    id: 'skills-quantity',
    category: 'skills',
    title: 'Densidade de Competências Técnicas (Mínimo 6)',
    description: hasMinSkills
      ? `${uniqueSkills.length} competências cadastradas, garantindo boa indexação de palavras-chave.`
      : `Apenas ${uniqueSkills.length} competência(s) listada(s). Recomenda-se no mínimo 6 a 12 competências técnicas.`,
    severity: hasMinSkills ? 'success' : 'critical',
    passed: hasMinSkills,
    scoreImpact: 8,
    scoreEarned: hasMinSkills ? 8 : Math.min(uniqueSkills.length * 1.2, 5),
    suggestion: hasMinSkills ? undefined : 'Adicione as principais ferramentas, linguagens e metodologias que domina (ex: React, SQL, Git).'
  });

  const hasNoDuplicates = rawSkills.length === uniqueSkills.length;
  checks.push({
    id: 'skills-duplicates',
    category: 'skills',
    title: 'Competências Únicas e Sem Repetição',
    description: hasNoDuplicates
      ? 'Nenhuma competência duplicada encontrada.'
      : 'Há competências repetidas na lista de habilidades.',
    severity: hasNoDuplicates ? 'success' : 'warning',
    passed: hasNoDuplicates,
    scoreImpact: 3,
    scoreEarned: hasNoDuplicates ? 3 : 1,
    suggestion: hasNoDuplicates ? undefined : 'Remova termos repetidos na seção de competências.'
  });

  const hasStandardLengthSkills = uniqueSkills.every((s) => s.length <= 40);
  checks.push({
    id: 'skills-formatting',
    category: 'skills',
    title: 'Formatação Correta de Habilidades',
    description: hasStandardLengthSkills
      ? 'Habilidades formatadas como termos objetivos e concisos.'
      : 'Algumas habilidades estão muito extensas ou parecem frases completas.',
    severity: hasStandardLengthSkills ? 'success' : 'warning',
    passed: hasStandardLengthSkills,
    scoreImpact: 3,
    scoreEarned: hasStandardLengthSkills ? 3 : 1,
    suggestion: hasStandardLengthSkills ? undefined : 'Mantenha cada habilidade como uma palavra ou expressão curta (ex: "Docker", não "Experiência com Docker").'
  });

  // ==========================================
  // 6. FORMAÇÃO & CRONOLOGIA (Total: 8 pts)
  // ==========================================
  const educationList = cvData.education || [];
  const hasEducation = educationList.length > 0 && Boolean(educationList[0].institution && educationList[0].degree);
  checks.push({
    id: 'edu-presence',
    category: 'education',
    title: 'Formação Acadêmica Detalhada',
    description: hasEducation
      ? 'Formação acadêmica identificada com curso e instituição.'
      : 'Formação acadêmica ausente ou incompleta. Essencial para validação de requisitos de escolaridade.',
    severity: hasEducation ? 'success' : 'warning',
    passed: hasEducation,
    scoreImpact: 4,
    scoreEarned: hasEducation ? 4 : 0,
    suggestion: hasEducation ? undefined : 'Informe sua graduação, curso técnico ou formação com o nome da instituição.'
  });

  // Date format checking
  const dateRegex = /^(\d{4}|\d{2}\/\d{4}|\d{4}-\d{2})$/;
  const allDates = [
    ...(cvData.experience || []).flatMap((e) => [e.startDate, e.endDate].filter(Boolean)),
    ...(cvData.education || []).flatMap((e) => [e.startDate, e.endDate].filter(Boolean))
  ];
  const validDates = allDates.filter((d) => dateRegex.test(d.trim()));
  const datesConsistent = allDates.length === 0 || validDates.length >= allDates.length * 0.75;

  checks.push({
    id: 'dates-format',
    category: 'education',
    title: 'Padronização de Datas Cronológicas',
    description: datesConsistent
      ? 'Datas em formatos numéricos consistentes (ex: MM/AAAA ou AAAA).'
      : 'Algumas datas estão em formatos não padronizados, dificultando a ordenação cronológica pelo ATS.',
    severity: datesConsistent ? 'success' : 'warning',
    passed: datesConsistent,
    scoreImpact: 4,
    scoreEarned: datesConsistent ? 4 : 1,
    suggestion: datesConsistent ? undefined : 'Utilize sempre formatos como "03/2023" ou "2023" para datas.'
  });

  // ==========================================
  // AGREGAR SCORES E RESULTADOS
  // ==========================================
  let totalScoreEarned = 0;
  let totalScorePossible = 0;

  const categoryTotals: Record<AtsCategory, { earned: number; total: number; passed: number; count: number }> = {
    layout: { earned: 0, total: 0, passed: 0, count: 0 },
    contact: { earned: 0, total: 0, passed: 0, count: 0 },
    summary: { earned: 0, total: 0, passed: 0, count: 0 },
    experience: { earned: 0, total: 0, passed: 0, count: 0 },
    skills: { earned: 0, total: 0, passed: 0, count: 0 },
    education: { earned: 0, total: 0, passed: 0, count: 0 }
  };

  const categoryLabels: Record<AtsCategory, string> = {
    layout: 'Estrutura & Layout',
    contact: 'Dados de Contato',
    summary: 'Resumo Profissional',
    experience: 'Experiência & Impacto',
    skills: 'Competências & Keywords',
    education: 'Formação & Cronologia'
  };

  let criticalCount = 0;
  let warningCount = 0;
  let passedCount = 0;

  checks.forEach((item) => {
    totalScoreEarned += item.scoreEarned;
    totalScorePossible += item.scoreImpact;

    const cat = categoryTotals[item.category];
    cat.earned += item.scoreEarned;
    cat.total += item.scoreImpact;
    cat.count += 1;
    if (item.passed) {
      cat.passed += 1;
      passedCount += 1;
    } else if (item.severity === 'critical') {
      criticalCount += 1;
    } else {
      warningCount += 1;
    }
  });

  const overallScore = Math.min(100, Math.round((totalScoreEarned / (totalScorePossible || 1)) * 100));

  let rating: AtsRating = 'poor';
  let ratingLabel = 'Crítico';

  if (overallScore >= 90) {
    rating = 'excellent';
    ratingLabel = 'Excelente';
  } else if (overallScore >= 75) {
    rating = 'good';
    ratingLabel = 'Bom';
  } else if (overallScore >= 55) {
    rating = 'average';
    ratingLabel = 'Regular';
  }

  const categories: any = {};
  (Object.keys(categoryTotals) as AtsCategory[]).forEach((catKey) => {
    const item = categoryTotals[catKey];
    categories[catKey] = {
      category: catKey,
      label: categoryLabels[catKey],
      score: Math.round((item.earned / (item.total || 1)) * 100),
      earnedPoints: item.earned,
      totalPoints: item.total,
      passedCount: item.passed,
      totalCount: item.count
    };
  });

  const robotPlainText = generateATSRobotText(cvData);

  return {
    overallScore,
    rating,
    ratingLabel,
    categories,
    checks,
    criticalIssuesCount: criticalCount,
    warningIssuesCount: warningCount,
    passedCount,
    robotPlainText,
    actionVerbsDetected: detectedActionVerbs,
    metricsDetected: uniqueMetrics
  };
}

/**
 * Simulates plain text parsing extraction performed by ATS systems (Taleo, Greenhouse, Workable)
 */
export function generateATSRobotText(cv: CVData): string {
  const parts: string[] = [];

  // HEADER / CONTACT
  parts.push('=== CABEÇALHO & CONTATO ===');
  if (cv.personal.fullName) parts.push(`NOME: ${cv.personal.fullName}`);
  if (cv.personal.title) parts.push(`CARGO ALVO: ${cv.personal.title}`);
  const contactLine = [
    cv.personal.email,
    cv.personal.phone,
    cv.personal.location,
    cv.personal.linkedin,
    cv.personal.github
  ].filter(Boolean).join(' | ');
  if (contactLine) parts.push(`CONTATO: ${contactLine}`);
  parts.push('');

  // SUMMARY
  if (cv.objective) {
    parts.push('=== RESUMO PROFISSIONAL ===');
    parts.push(cv.objective);
    parts.push('');
  }

  // EXPERIENCES
  if (cv.experience && cv.experience.length > 0) {
    parts.push('=== EXPERIÊNCIA PROFISSIONAL ===');
    cv.experience.forEach((exp) => {
      const period = [exp.startDate, exp.endDate || 'Presente'].filter(Boolean).join(' - ');
      parts.push(`CARGO: ${exp.role || 'Não especificado'}`);
      parts.push(`EMPRESA: ${exp.company || 'Não especificado'} ${exp.location ? `(${exp.location})` : ''}`);
      if (period) parts.push(`PERÍODO: ${period}`);
      if (exp.description) {
        parts.push('RESPONSABILIDADES E CONQUISTAS:');
        parts.push(exp.description);
      }
      parts.push('---');
    });
    parts.push('');
  }

  // EDUCATION
  if (cv.education && cv.education.length > 0) {
    parts.push('=== FORMAÇÃO ACADÊMICA ===');
    cv.education.forEach((edu) => {
      const period = [edu.startDate, edu.endDate || 'Presente'].filter(Boolean).join(' - ');
      parts.push(`GRAU/CURSO: ${edu.degree || 'Não especificado'}`);
      parts.push(`INSTITUIÇÃO: ${edu.institution || 'Não especificado'}`);
      if (period) parts.push(`PERÍODO: ${period}`);
      if (edu.description) parts.push(`DETALHES: ${edu.description}`);
      parts.push('---');
    });
    parts.push('');
  }

  // CERTIFICATES
  if (cv.certificates && cv.certificates.length > 0) {
    parts.push('=== CERTIFICAÇÕES ===');
    cv.certificates.forEach((cert) => {
      parts.push(`• ${cert.name} - ${cert.organization} (${cert.date || 'S/D'})`);
    });
    parts.push('');
  }

  // SKILLS
  if (cv.skills && cv.skills.length > 0) {
    parts.push('=== COMPETÊNCIAS & PALAVRAS-CHAVE ===');
    parts.push(cv.skills.join(', '));
    parts.push('');
  }

  // LANGUAGES
  if (cv.languages && cv.languages.length > 0) {
    parts.push('=== IDIOMAS ===');
    cv.languages.forEach((lang) => {
      parts.push(`• ${lang.name}: ${lang.level}`);
    });
  }

  return parts.join('\n');
}

/**
 * Compares CV content against a job description text, identifying keywords and match percentage
 */
export function compareWithJobDescription(cv: CVData, jobText: string): AtsJobMatchResult {
  if (!jobText || jobText.trim().length === 0) {
    return {
      matchPercentage: 0,
      matchedKeywords: [],
      missingKeywords: []
    };
  }

  // Extract candidate tokens from Job Description
  const rawTokens = jobText
    .toLowerCase()
    .replace(/[^\w\s\+]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Count word frequencies to find significant keywords
  const frequencyMap = new Map<string, number>();
  rawTokens.forEach((token) => {
    frequencyMap.set(token, (frequencyMap.get(token) || 0) + 1);
  });

  // Select the top 20 most frequent keywords from job description
  const topKeywords = Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  // Build corpus of CV text
  const cvText = [
    cv.personal.title,
    cv.objective,
    ...(cv.skills || []),
    ...(cv.experience || []).flatMap((e) => [e.role, e.description]),
    ...(cv.education || []).flatMap((e) => [e.degree, e.description]),
    ...(cv.certificates || []).map((c) => c.name)
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  topKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(cvText)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  });

  const total = topKeywords.length;
  const matchPercentage = total > 0 ? Math.round((matchedKeywords.length / total) * 100) : 0;

  return {
    matchPercentage,
    matchedKeywords,
    missingKeywords
  };
}
