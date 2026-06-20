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
  certificates: CertificateItem[];
  skills: string[];
  languages: LanguageItem[];
  style: StyleConfig;
}
