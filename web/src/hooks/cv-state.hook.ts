import { useState, useEffect, useMemo } from 'react';
import { sampleData } from '../constants/sample-data.constants';
import {
  CVData,
  PersonalData,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  CertificateItem,
  LanguageItem,
  StyleConfig,
  JobTarget,
  TargetedCuration,
  CuratedJobResume,
  ViewMode
} from '../types/cv.model';
import { pruneCurationToFitA4 } from '../utils/a4-density-pruner';

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
  projects: [],
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

/**
 * Pure function that derives the rendered 1-page CV from Master Profile + Job Curation
 */
export function deriveTargetedCV(
  master: CVData,
  curation?: TargetedCuration | null
): CVData {
  if (!curation) return master;

  // Aplica o algoritmo de poda progressiva determinística para garantia física de 1 página A4
  const { curation: pruned, spacing } = pruneCurationToFitA4(master, curation);

  return {
    ...master,
    personal: {
      ...master.personal,
      title: pruned.tailoredTitle || master.personal.title
    },
    objective: pruned.tailoredObjective || master.objective,
    experience: master.experience
      .filter(exp => pruned.experience[exp.id]?.included ?? true)
      .map(exp => {
        const itemCur = pruned.experience[exp.id];
        const useTailored = itemCur?.useTailoredText ?? true;
        return {
          ...exp,
          description: useTailored && itemCur?.tailoredDescription ? itemCur.tailoredDescription : exp.description
        };
      }),
    projects: (master.projects || [])
      .filter(proj => pruned.projects?.[proj.id]?.included ?? true)
      .map(proj => {
        const itemCur = pruned.projects?.[proj.id];
        const useTailored = itemCur?.useTailoredText ?? true;
        return {
          ...proj,
          description: useTailored && itemCur?.tailoredDescription ? itemCur.tailoredDescription : proj.description
        };
      }),
    education: master.education.filter(edu => pruned.education[edu.id]?.included ?? true),
    certificates: master.certificates.filter(cert => pruned.certificates[cert.id]?.included ?? true),
    skills: pruned.selectedSkills.length > 0 ? pruned.selectedSkills : master.skills,
    languages: master.languages,
    style: {
      ...master.style,
      spacing: spacing === 'compact' ? 'compact' : master.style?.spacing || 'normal'
    }
  };
}

export function useCVState() {
  // MASTER PROFILE (Minha Bagagem Profissional)
  const [masterProfile, setMasterProfile] = useState<CVData>(() => {
    const masterSaved = localStorage.getItem('vitae_master_profile') || localStorage.getItem('cv_builder_data');
    if (masterSaved) {
      try {
        const parsed = JSON.parse(masterSaved) as CVData;
        return {
          ...parsed,
          projects: Array.isArray(parsed.projects) ? parsed.projects : []
        };
      } catch (e) {
        console.error("Erro ao carregar Master Profile do LocalStorage", e);
      }
    }
    return sampleData;
  });

  // SAVED JOBS & CURATIONS
  const [savedJobs, setSavedJobs] = useState<CuratedJobResume[]>(() => {
    const saved = localStorage.getItem('vitae_curated_jobs');
    if (saved) {
      try {
        return JSON.parse(saved) as CuratedJobResume[];
      } catch (e) {
        console.error("Erro ao carregar vagas salvas do LocalStorage", e);
      }
    }
    return [];
  });

  // ACTIVE VIEW MODE ('master' | 'curated')
  const [activeMode, setActiveMode] = useState<ViewMode>('master');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Sync Master Profile with LocalStorage
  useEffect(() => {
    localStorage.setItem('vitae_master_profile', JSON.stringify(masterProfile));
    localStorage.setItem('cv_builder_data', JSON.stringify(masterProfile)); // backward compatibility
  }, [masterProfile]);

  // Sync Saved Jobs with LocalStorage
  useEffect(() => {
    localStorage.setItem('vitae_curated_jobs', JSON.stringify(savedJobs));
  }, [savedJobs]);

  const activeJob = useMemo(() => {
    if (activeMode !== 'curated' || !activeJobId) return null;
    return savedJobs.find(item => item.job.id === activeJobId) || null;
  }, [activeMode, activeJobId, savedJobs]);

  // RENDERED CV (Projeção para o CVPreview e impressão)
  const cvData = useMemo(() => {
    if (activeMode === 'curated' && activeJob) {
      const baseCv = activeJob.cv || deriveTargetedCV(masterProfile, activeJob.curation);
      return {
        ...baseCv,
        experience: baseCv.experience.filter(exp => activeJob.curation?.experience?.[exp.id]?.included ?? true),
        projects: (baseCv.projects || []).filter(proj => activeJob.curation?.projects?.[proj.id]?.included ?? true),
        education: baseCv.education.filter(edu => activeJob.curation?.education?.[edu.id]?.included ?? true),
        certificates: baseCv.certificates.filter(cert => activeJob.curation?.certificates?.[cert.id]?.included ?? true)
      };
    }
    return masterProfile;
  }, [activeMode, activeJob, masterProfile]);

  // MUTATION DISPATCHER (Isola edições da bagagem ativa da Bagagem Mestra)
  const updateActiveCV = (updater: (current: CVData) => CVData) => {
    if (activeMode === 'curated' && activeJobId) {
      setSavedJobs(prev => prev.map(entry => {
        if (entry.job.id !== activeJobId) return entry;
        const currentCv = entry.cv || deriveTargetedCV(masterProfile, entry.curation);
        return {
          ...entry,
          cv: updater(currentCv)
        };
      }));
    } else {
      setMasterProfile(prev => updater(prev));
    }
  };

  // Compatibility setter for import / JSON reset
  const setCvData = (updater: CVData | ((prev: CVData) => CVData)) => {
    if (typeof updater === 'function') {
      updateActiveCV(prev => updater(prev));
    } else {
      updateActiveCV(() => updater);
    }
  };

  // JOB CURATION MANAGEMENT
  const addCuratedJob = (job: JobTarget, curation: TargetedCuration, customCv?: CVData) => {
    const initialCv = customCv ? { ...customCv } : deriveTargetedCV(masterProfile, curation);
    const newEntry: CuratedJobResume = {
      job,
      curation,
      cv: initialCv
    };
    setSavedJobs(prev => {
      const filtered = prev.filter(item => item.job.id !== job.id);
      return [newEntry, ...filtered];
    });
    setActiveJobId(job.id);
    setActiveMode('curated');
  };

  const removeCuratedJob = (jobId: string) => {
    setSavedJobs(prev => prev.filter(item => item.job.id !== jobId));
    if (activeJobId === jobId) {
      setActiveJobId(null);
      setActiveMode('master');
    }
  };

  const selectMasterMode = () => {
    setActiveMode('master');
    setActiveJobId(null);
  };

  const selectJobMode = (jobId: string) => {
    const exists = savedJobs.some(item => item.job.id === jobId);
    if (exists) {
      setActiveJobId(jobId);
      setActiveMode('curated');
    }
  };

  const toggleItemInclusion = (
    section: 'experience' | 'projects' | 'education' | 'certificates',
    itemId: string
  ) => {
    if (!activeJobId) return;

    setSavedJobs(prev => prev.map(entry => {
      if (entry.job.id !== activeJobId) return entry;
      const sectionMap = entry.curation[section] || {};
      const current = sectionMap[itemId] || { included: true };
      const updated = {
        ...entry.curation,
        [section]: {
          ...sectionMap,
          [itemId]: {
            ...current,
            included: !current.included
          }
        }
      };
      return { ...entry, curation: updated };
    }));
  };

  const toggleTailoredText = (
    section: 'experience' | 'projects',
    itemId: string
  ) => {
    if (!activeJobId) return;

    setSavedJobs(prev => prev.map(entry => {
      if (entry.job.id !== activeJobId) return entry;
      const sectionMap = entry.curation[section] || {};
      const current = sectionMap[itemId] || { included: true, useTailoredText: true };
      const updated = {
        ...entry.curation,
        [section]: {
          ...sectionMap,
          [itemId]: {
            ...current,
            useTailoredText: current.useTailoredText === false ? true : false
          }
        }
      };
      return { ...entry, curation: updated };
    }));
  };

  // MUTATION HANDLERS (Operam na bagagem ativa sem alterar a Mestra quando em modo curated)
  const handleChangePersonal = (field: keyof PersonalData, value: string) => {
    updateActiveCV(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value
      }
    }));
  };

  const handleChangeObjective = (value: string) => {
    updateActiveCV(prev => ({
      ...prev,
      objective: value
    }));
  };

  const handleChangeStyle = (field: keyof StyleConfig, value: string) => {
    updateActiveCV(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [field]: value
      }
    }));
  };

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
    updateActiveCV(prev => ({
      ...prev,
      experience: [...prev.experience, newItem]
    }));
  };

  const handleUpdateExperience = (id: string, field: keyof ExperienceItem, value: string) => {
    updateActiveCV(prev => ({
      ...prev,
      experience: prev.experience.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveExperience = (id: string) => {
    updateActiveCV(prev => ({
      ...prev,
      experience: prev.experience.filter(item => item.id !== id)
    }));
  };

  const handleMoveExperience = (index: number, direction: number) => {
    updateActiveCV(prev => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.experience.length) return prev;
      const items = [...prev.experience];
      const [moved] = items.splice(index, 1);
      items.splice(newIndex, 0, moved);
      return { ...prev, experience: items };
    });
  };

  const handleAddEducation = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: "",
      degree: "",
      startDate: "",
      endDate: "",
      description: ""
    };
    updateActiveCV(prev => ({
      ...prev,
      education: [...prev.education, newItem]
    }));
  };

  const handleUpdateEducation = (id: string, field: keyof EducationItem, value: string) => {
    updateActiveCV(prev => ({
      ...prev,
      education: prev.education.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveEducation = (id: string) => {
    updateActiveCV(prev => ({
      ...prev,
      education: prev.education.filter(item => item.id !== id)
    }));
  };

  const handleMoveEducation = (index: number, direction: number) => {
    updateActiveCV(prev => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.education.length) return prev;
      const items = [...prev.education];
      const [moved] = items.splice(index, 1);
      items.splice(newIndex, 0, moved);
      return { ...prev, education: items };
    });
  };

  const handleAddProject = () => {
    const newItem: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: "",
      role: "",
      link: "",
      startDate: "",
      endDate: "",
      description: ""
    };
    updateActiveCV(prev => ({
      ...prev,
      projects: [...(prev.projects || []), newItem]
    }));
  };

  const handleUpdateProject = (id: string, field: keyof ProjectItem, value: string) => {
    updateActiveCV(prev => ({
      ...prev,
      projects: (prev.projects || []).map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveProject = (id: string) => {
    updateActiveCV(prev => ({
      ...prev,
      projects: (prev.projects || []).filter(item => item.id !== id)
    }));
  };

  const handleMoveProject = (index: number, direction: number) => {
    updateActiveCV(prev => {
      const currentProjects = prev.projects || [];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= currentProjects.length) return prev;
      const items = [...currentProjects];
      const [moved] = items.splice(index, 1);
      items.splice(newIndex, 0, moved);
      return { ...prev, projects: items };
    });
  };

  const handleAddCertificate = () => {
    const newItem: CertificateItem = {
      id: `cert-${Date.now()}`,
      name: "",
      organization: "",
      date: ""
    };
    updateActiveCV(prev => ({
      ...prev,
      certificates: [...prev.certificates, newItem]
    }));
  };

  const handleUpdateCertificate = (id: string, field: keyof CertificateItem, value: string) => {
    updateActiveCV(prev => ({
      ...prev,
      certificates: prev.certificates.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveCertificate = (id: string) => {
    updateActiveCV(prev => ({
      ...prev,
      certificates: prev.certificates.filter(item => item.id !== id)
    }));
  };

  const handleMoveCertificate = (index: number, direction: number) => {
    updateActiveCV(prev => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.certificates.length) return prev;
      const items = [...prev.certificates];
      const [moved] = items.splice(index, 1);
      items.splice(newIndex, 0, moved);
      return { ...prev, certificates: items };
    });
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    updateActiveCV(prev => {
      if (prev.skills.includes(trimmed)) return prev;
      return {
        ...prev,
        skills: [...prev.skills, trimmed]
      };
    });
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    updateActiveCV(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleAddLanguage = () => {
    const newItem: LanguageItem = {
      id: `lang-${Date.now()}`,
      name: "",
      level: "Intermediário"
    };
    updateActiveCV(prev => ({
      ...prev,
      languages: [...prev.languages, newItem]
    }));
  };

  const handleUpdateLanguage = (id: string, field: keyof LanguageItem, value: string) => {
    updateActiveCV(prev => ({
      ...prev,
      languages: prev.languages.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveLanguage = (id: string) => {
    updateActiveCV(prev => ({
      ...prev,
      languages: prev.languages.filter(item => item.id !== id)
    }));
  };

  const resetToEmpty = () => {
    if (activeMode === 'curated' && activeJobId) {
      updateActiveCV(() => ({ ...emptyData }));
    } else {
      setMasterProfile(emptyData);
    }
  };

  const loadSample = () => {
    if (activeMode === 'curated' && activeJobId) {
      updateActiveCV(() => ({ ...sampleData }));
    } else {
      setMasterProfile(sampleData);
    }
  };

  return {
    cvData,
    masterProfile,
    savedJobs,
    activeMode,
    activeJobId,
    activeJob,
    selectMasterMode,
    selectJobMode,
    addCuratedJob,
    removeCuratedJob,
    toggleItemInclusion,
    toggleTailoredText,
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
    onAddProject: handleAddProject,
    onUpdateProject: handleUpdateProject,
    onRemoveProject: handleRemoveProject,
    onMoveProject: handleMoveProject,
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
