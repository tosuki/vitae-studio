import { useState, useEffect } from 'react';
import { sampleData } from '../constants/sampleData';
import { CVData, PersonalData, ExperienceItem, EducationItem, CertificateItem, LanguageItem, StyleConfig } from '../types/cv';

const emptyData: CVData = {
  personal: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: ""
  },
  objective: "",
  experience: [],
  education: [],
  certificates: [],
  skills: [],
  languages: [],
  style: {
    theme: "modern",
    fontFamily: "inter",
    accentColor: "#7c3aed",
    spacing: "normal"
  }
};

export function useCVState() {
  const [cvData, setCvData] = useState<CVData>(() => {
    const saved = localStorage.getItem('cv_builder_data');
    if (saved) {
      try {
        return JSON.parse(saved) as CVData;
      } catch (e) {
        console.error("Erro ao carregar dados do LocalStorage", e);
      }
    }
    return sampleData;
  });

  // Salvar no localStorage sempre que os dados mudarem
  useEffect(() => {
    localStorage.setItem('cv_builder_data', JSON.stringify(cvData));
  }, [cvData]);

  // DADOS PESSOAIS
  const handleChangePersonal = (field: keyof PersonalData, value: string) => {
    setCvData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value
      }
    }));
  };

  // OBJETIVO
  const handleChangeObjective = (value: string) => {
    setCvData(prev => ({
      ...prev,
      objective: value
    }));
  };

  // ESTILO
  const handleChangeStyle = (field: keyof StyleConfig, value: string) => {
    setCvData(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [field]: value
      }
    }));
  };

  // EXPERIÊNCIA
  const handleAddExperience = () => {
    const newItem: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: "",
      role: "",
      location: "",
      startDate: "",
      endDate: "",
      description: ""
    };
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, newItem]
    }));
  };

  const handleUpdateExperience = (id: string, field: keyof ExperienceItem, value: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveExperience = (id: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter(item => item.id !== id)
    }));
  };

  const handleMoveExperience = (index: number, direction: number) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= cvData.experience.length) return;
    
    setCvData(prev => {
      const list = [...prev.experience];
      const temp = list[index];
      list[index] = list[nextIndex];
      list[nextIndex] = temp;
      return { ...prev, experience: list };
    });
  };

  // FORMAÇÃO
  const handleAddEducation = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: "",
      degree: "",
      startDate: "",
      endDate: "",
      description: ""
    };
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, newItem]
    }));
  };

  const handleUpdateEducation = (id: string, field: keyof EducationItem, value: string) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveEducation = (id: string) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter(item => item.id !== id)
    }));
  };

  const handleMoveEducation = (index: number, direction: number) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= cvData.education.length) return;

    setCvData(prev => {
      const list = [...prev.education];
      const temp = list[index];
      list[index] = list[nextIndex];
      list[nextIndex] = temp;
      return { ...prev, education: list };
    });
  };

  // CERTIFICADOS
  const handleAddCertificate = () => {
    const newItem: CertificateItem = {
      id: `cert-${Date.now()}`,
      name: "",
      organization: "",
      date: ""
    };
    setCvData(prev => ({
      ...prev,
      certificates: [...prev.certificates, newItem]
    }));
  };

  const handleUpdateCertificate = (id: string, field: keyof CertificateItem, value: string) => {
    setCvData(prev => ({
      ...prev,
      certificates: prev.certificates.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveCertificate = (id: string) => {
    setCvData(prev => ({
      ...prev,
      certificates: prev.certificates.filter(item => item.id !== id)
    }));
  };

  const handleMoveCertificate = (index: number, direction: number) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= cvData.certificates.length) return;

    setCvData(prev => {
      const list = [...prev.certificates];
      const temp = list[index];
      list[index] = list[nextIndex];
      list[nextIndex] = temp;
      return { ...prev, certificates: list };
    });
  };

  // COMPETÊNCIAS (SKILLS)
  const handleAddSkill = (skill: string) => {
    if (cvData.skills.includes(skill)) return;
    setCvData(prev => ({
      ...prev,
      skills: [...prev.skills, skill]
    }));
  };

  const handleRemoveSkill = (skill: string) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // IDIOMAS
  const handleAddLanguage = () => {
    const newItem: LanguageItem = {
      id: `lang-${Date.now()}`,
      name: "",
      level: "Intermediário"
    };
    setCvData(prev => ({
      ...prev,
      languages: [...prev.languages, newItem]
    }));
  };

  const handleUpdateLanguage = (id: string, field: keyof LanguageItem, value: string) => {
    setCvData(prev => ({
      ...prev,
      languages: prev.languages.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveLanguage = (id: string) => {
    setCvData(prev => ({
      ...prev,
      languages: prev.languages.filter(item => item.id !== id)
    }));
  };

  // OPERAÇÕES GLOBAIS
  const resetToEmpty = () => {
    setCvData(emptyData);
  };

  const loadSample = () => {
    setCvData(sampleData);
  };

  return {
    cvData,
    setCvData,
    onChangePersonal: handleChangePersonal,
    onChangeObjective: handleChangeObjective,
    onChangeStyle: handleChangeStyle,
    onAddExperience: handleAddExperience,
    onUpdateExperience: handleUpdateExperience,
    onRemoveExperience: handleRemoveExperience,
    onMoveExperience: handleMoveExperience,
    onAddEducation: handleAddEducation,
    onUpdateEducation: handleUpdateEducation,
    onRemoveEducation: handleRemoveEducation,
    onMoveEducation: handleMoveEducation,
    onAddCertificate: handleAddCertificate,
    onUpdateCertificate: handleUpdateCertificate,
    onRemoveCertificate: handleRemoveCertificate,
    onMoveCertificate: handleMoveCertificate,
    onAddSkill: handleAddSkill,
    onRemoveSkill: handleRemoveSkill,
    onAddLanguage: handleAddLanguage,
    onUpdateLanguage: handleUpdateLanguage,
    onRemoveLanguage: handleRemoveLanguage,
    resetToEmpty,
    loadSample
  };
}
