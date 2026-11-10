export interface PersonalData {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
}

export interface ExperienceItem {
    id: string;
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface EducationItem {
    id: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface ProjectItem {
    id: string;
    name: string;
    role: string;
    link: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface CertificateItem {
    id: string;
    name: string;
    organization: string;
    date: string;
}

export interface LanguageItem {
    id: string;
    name: string;
    level: string;
}

export interface StyleConfig {
    theme: string;
    fontFamily: string;
    accentColor: string;
    spacing: string;
}

export interface CVData {
    personal: PersonalData;
    objective: string;
    experience: ExperienceItem[];
    education: EducationItem[];
    projects: ProjectItem[];
    certificates: CertificateItem[];
    skills: string[];
    languages: LanguageItem[];
    style: StyleConfig;
}

export interface ItemCuration {
    included: boolean;
    relevanceScore?: number;
    tailoredDescription?: string;
}

export interface TargetedCuration {
    jobTitle: string;
    company?: string;
    matchScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    tailoredObjective: string;
    experience: Record<string, ItemCuration>;
    projects: Record<string, ItemCuration>;
    education: Record<string, ItemCuration>;
    certificates: Record<string, ItemCuration>;
    selectedSkills: string[];
}

