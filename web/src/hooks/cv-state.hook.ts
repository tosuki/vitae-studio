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

  return {
    ...master,
    objective: curation.tailoredObjective || master.objective,
    experience: master.experience
      .filter(exp => curation.experience[exp.id]?.included ?? true)
      .map(exp => {
        const itemCur = curation.experience[exp.id];
        const useTailored = itemCur?.useTailoredText ?? true;
        return {
          ...exp,
          description: useTailored && itemCur?.tailoredDescription ? itemCur.tailoredDescription : exp.description
        };
      }),
    projects: (master.projects || [])
      .filter(proj => curation.projects[proj.id]?.included ?? true)
      .map(proj => {
        const itemCur = curation.projects[proj.id];
        const useTailored = itemCur?.useTailoredText ?? true;
        return {
          ...proj,
          description: useTailored && itemCur?.tailoredDescription ? itemCur.tailoredDescription : proj.description
        };
      }),
    education: master.education.filter(edu => curation.education[edu.id]?.included ?? true),
    certificates: master.certificates.filter(cert => curation.certificates[cert.id]?.included ?? true),
    skills: curation.selectedSkills.length > 0 ? curation.selectedSkills : master.skills,
    languages: master.languages,
    style: master.style
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
      return deriveTargetedCV(masterProfile, activeJob.curation);
    }
    return masterProfile;
  }, [activeMode, activeJob, masterProfile]);

  // Compatibility setter for import / JSON reset
  const setCvData = (updater: CVData | ((prev: CVData) => CVData)) => {
    if (typeof updater === 'function') {
      setMasterProfile(prev => updater(prev));
    } else {
      setMasterProfile(updater);
    }
  };

  // JOB CURATION MANAGEMENT
  const addCuratedJob = (job: JobTarget, curation: TargetedCuration) => {
    const newEntry: CuratedJobResume = { job, curation };
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

  // MASTER PROFILE MUTATION HANDLERS
  const handleChangePersonal = (field: keyof PersonalData, value: string) => {
    setMasterProfile(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value
      }
    }));
  };

  const handleChangeObjective = (value: string) => {
    setMasterProfile(prev => ({
      ...prev,
      objective: value
    }));
  };

  const handleChangeStyle = (field: keyof StyleConfig, value: string) => {
    setMasterProfile(prev => ({
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
    setMasterProfile(prev => ({
      ...prev,
      experience: [...prev.experience, newItem]
    }));
  };

  const handleUpdateExperience = (id: string, field: keyof ExperienceItem, value: string) => {
    setMasterProfile(prev => ({
      ...prev,
      experience: prev.experience.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveExperience = (id: string) => {
    setMasterProfile(prev => ({
      ...prev,
      experience: prev.experience.filter(item => item.id !== id)
    }));
  };

  const handleMoveExperience = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= masterProfile.experience.length) return;
    const items = [...masterProfile.experience];
    const [moved] = items.splice(index, 1);
    items.splice(newIndex, 0, moved);
    setMasterProfile(prev => ({ ...prev, experience: items }));
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
    setMasterProfile(prev => ({
      ...prev,
      education: [...prev.education, newItem]
    }));
  };

  const handleUpdateEducation = (id: string, field: keyof EducationItem, value: string) => {
    setMasterProfile(prev => ({
      ...prev,
      education: prev.education.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveEducation = (id: string) => {
    setMasterProfile(prev => ({
      ...prev,
      education: prev.education.filter(item => item.id !== id)
    }));
  };

  const handleMoveEducation = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= masterProfile.education.length) return;
    const items = [...masterProfile.education];
    const [moved] = items.splice(index, 1);
    items.splice(newIndex, 0, moved);
    setMasterProfile(prev => ({ ...prev, education: items }));
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
    setMasterProfile(prev => ({
      ...prev,
      projects: [...(prev.projects || []), newItem]
    }));
  };

  const handleUpdateProject = (id: string, field: keyof ProjectItem, value: string) => {
    setMasterProfile(prev => ({
      ...prev,
      projects: (prev.projects || []).map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveProject = (id: string) => {
    setMasterProfile(prev => ({
      ...prev,
      projects: (prev.projects || []).filter(item => item.id !== id)
    }));
  };

  const handleMoveProject = (index: number, direction: number) => {
    const currentProjects = masterProfile.projects || [];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentProjects.length) return;
    const items = [...currentProjects];
    const [moved] = items.splice(index, 1);
    items.splice(newIndex, 0, moved);
    setMasterProfile(prev => ({ ...prev, projects: items }));
  };

  const handleAddCertificate = () => {
    const newItem: CertificateItem = {
      id: `cert-${Date.now()}`,
      name: "",
      organization: "",
      date: ""
    };
    setMasterProfile(prev => ({
      ...prev,
      certificates: [...prev.certificates, newItem]
    }));
  };

  const handleUpdateCertificate = (id: string, field: keyof CertificateItem, value: string) => {
    setMasterProfile(prev => ({
      ...prev,
      certificates: prev.certificates.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveCertificate = (id: string) => {
    setMasterProfile(prev => ({
      ...prev,
      certificates: prev.certificates.filter(item => item.id !== id)
    }));
  };

  const handleMoveCertificate = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= masterProfile.certificates.length) return;
    const items = [...masterProfile.certificates];
    const [moved] = items.splice(index, 1);
    items.splice(newIndex, 0, moved);
    setMasterProfile(prev => ({ ...prev, certificates: items }));
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !masterProfile.skills.includes(trimmed)) {
      setMasterProfile(prev => ({
        ...prev,
        skills: [...prev.skills, trimmed]
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setMasterProfile(prev => ({
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
    setMasterProfile(prev => ({
      ...prev,
      languages: [...prev.languages, newItem]
    }));
  };

  const handleUpdateLanguage = (id: string, field: keyof LanguageItem, value: string) => {
    setMasterProfile(prev => ({
      ...prev,
      languages: prev.languages.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveLanguage = (id: string) => {
    setMasterProfile(prev => ({
      ...prev,
      languages: prev.languages.filter(item => item.id !== id)
    }));
  };

  const resetToEmpty = () => {
    setMasterProfile(emptyData);
  };

  const loadSample = () => {
    setMasterProfile(sampleData);
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
