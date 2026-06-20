export const sampleData = {
  personal: {
    fullName: "Gabriel Silva Santos",
    title: "Desenvolvedor Frontend Senior",
    email: "gabriel.silva@email.com",
    phone: "(11) 98765-4321",
    location: "São Paulo, SP",
    linkedin: "linkedin.com/in/gabrielsilva",
    github: "github.com/gabrielsilva"
  },
  objective: "Desenvolvedor Frontend com mais de 6 anos de experiência na criação de interfaces web responsivas, dinâmicas e de alta performance utilizando React, Next.js e TypeScript. Focado em desenvolver produtos digitais escaláveis com excelente experiência do usuário (UX/UI), acessibilidade e código limpo.",
  experience: [
    {
      id: "exp-1",
      company: "TechNova Solutions",
      role: "Desenvolvedor Frontend Senior",
      location: "São Paulo, SP (Híbrido)",
      startDate: "2023-03",
      endDate: "", // Vazio significa 'Presente' ou 'Atual'
      description: "Liderança técnica no desenvolvimento da nova plataforma SaaS utilizando React 18 e Next.js. Otimização de performance de renderização web, resultando em 40% de redução no First Contentful Paint. Criação e manutenção do Design System interno em conjunto com o time de UX/UI, economizando tempo de desenvolvimento dos times em mais de 30%."
    },
    {
      id: "exp-2",
      company: "CodeCraft Studio",
      role: "Desenvolvedor React Pleno",
      location: "Remoto",
      startDate: "2021-01",
      endDate: "2023-02",
      description: "Desenvolvimento de e-commerces e Single Page Applications (SPAs) de alta fidelidade visual. Integração de APIs REST e GraphQL de alto tráfego. Implementação de testes unitários e de integração com Jest e React Testing Library, aumentando a cobertura de código geral para 85%."
    },
    {
      id: "exp-3",
      company: "Inova Digital",
      role: "Desenvolvedor Frontend Junior",
      location: "São Paulo, SP",
      startDate: "2019-06",
      endDate: "2020-12",
      description: "Desenvolvimento de landing pages interativas e interfaces responsivas para clientes de médio porte. Otimização de SEO e conformidade de acessibilidade (WCAG 2.1). Manutenção de sistemas legados em jQuery e início da transição gradual para React."
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "Universidade de São Paulo (USP)",
      degree: "Bacharelado em Ciências da Computação",
      startDate: "2017",
      endDate: "2021",
      description: "Foco em engenharia de software, arquitetura de computadores e algoritmos complexos. Participação no grupo de pesquisa de Interfaces Humano-Computador (IHC)."
    }
  ],
  certificates: [
    {
      id: "cert-1",
      name: "React Design Patterns & Architecture",
      organization: "Frontend Masters",
      date: "2024"
    },
    {
      id: "cert-2",
      name: "TypeScript Professional Masterclass",
      organization: "Udemy",
      date: "2023"
    },
    {
      id: "cert-3",
      name: "Web Accessibility (WCAG 2.1)",
      organization: "W3C Brasil",
      date: "2022"
    }
  ],
  skills: [
    "React",
    "TypeScript",
    "Next.js",
    "JavaScript (ES6+)",
    "HTML5 / CSS3",
    "Tailwind / Sass",
    "Git & GitHub",
    "Jest / RTL",
    "REST & GraphQL",
    "UX/UI Design",
    "Webpack / Vite"
  ],
  languages: [
    { id: "lang-1", name: "Português", level: "Nativo" },
    { id: "lang-2", name: "Inglês", level: "Avançado (C1)" },
    { id: "lang-3", name: "Espanhol", level: "Básico" }
  ],
  style: {
    theme: "modern", // modern, classic, minimalist
    fontFamily: "inter", // inter, lora, roboto
    accentColor: "#7c3aed", // violet
    spacing: "normal" // compact, normal, relaxed
  }
};
