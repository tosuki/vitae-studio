import { useState, useEffect, useRef, CSSProperties } from 'react';
import FormSection from '../form-section.component';
import StyleForm from './style-form.component';
import PersonalForm from './personal-form.component';
import ObjectiveForm from './objective-form.component';
import ExperienceForm from './experience-form.component';
import EducationForm from './education-form.component';
import ProjectsForm from './projects-form.component';
import CertificatesForm from './certificates-form.component';
import SkillsForm from './skills-form.component';
import LanguagesForm from './languages-form.component';
import {
  CVData,
  PersonalData,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  CertificateItem,
  LanguageItem,
  StyleConfig,
  CuratedJobResume,
  ViewMode
} from '../../types/cv.model';
import './cv-editor.component.css';

interface CVEditorProps {
  data: CVData;
  style?: CSSProperties;
  onChangePersonal: (field: keyof PersonalData, value: string) => void;
  onChangeObjective: (value: string) => void;
  onChangeStyle: (field: keyof StyleConfig, value: string) => void;
  onAddExperience: () => void;
  onUpdateExperience: (id: string, field: keyof ExperienceItem, value: string) => void;
  onRemoveExperience: (id: string) => void;
  onMoveExperience: (index: number, direction: number) => void;
  onAddEducation: () => void;
  onUpdateEducation: (id: string, field: keyof EducationItem, value: string) => void;
  onRemoveEducation: (id: string) => void;
  onMoveEducation: (index: number, direction: number) => void;
  onAddProject: () => void;
  onUpdateProject: (id: string, field: keyof ProjectItem, value: string) => void;
  onRemoveProject: (id: string) => void;
  onMoveProject: (index: number, direction: number) => void;
  onAddCertificate: () => void;
  onUpdateCertificate: (id: string, field: keyof CertificateItem, value: string) => void;
  onRemoveCertificate: (id: string) => void;
  onMoveCertificate: (index: number, direction: number) => void;
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
  onAddLanguage: () => void;
  onUpdateLanguage: (id: string, field: keyof LanguageItem, value: string) => void;
  onRemoveLanguage: (id: string) => void;

  // Curation props
  activeMode?: ViewMode;
  activeJob?: CuratedJobResume | null;
  onToggleItemInclusion?: (section: 'experience' | 'projects' | 'education' | 'certificates', id: string) => void;
  onToggleTailoredText?: (section: 'experience' | 'projects', id: string) => void;
}

interface OpenSections {
  personal: boolean;
  objective: boolean;
  experience: boolean;
  education: boolean;
  projects: boolean;
  certificates: boolean;
  skills: boolean;
  languages: boolean;
  style: boolean;
}

export default function CVEditor({
  data,
  style,
  onChangePersonal,
  onChangeObjective,
  onChangeStyle,
  onAddExperience,
  onUpdateExperience,
  onRemoveExperience,
  onMoveExperience,
  onAddEducation,
  onUpdateEducation,
  onRemoveEducation,
  onMoveEducation,
  onAddProject,
  onUpdateProject,
  onRemoveProject,
  onMoveProject,
  onAddCertificate,
  onUpdateCertificate,
  onRemoveCertificate,
  onMoveCertificate,
  onAddSkill,
  onRemoveSkill,
  onAddLanguage,
  onUpdateLanguage,
  onRemoveLanguage,
  activeMode = 'master',
  activeJob = null,
  onToggleItemInclusion,
  onToggleTailoredText
}: CVEditorProps) {
  const [openSections, setOpenSections] = useState<OpenSections>({
    personal: true,
    objective: false,
    experience: true,
    education: false,
    projects: true,
    certificates: false,
    skills: false,
    languages: false,
    style: false
  });

  const toggleSection = (section: keyof OpenSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isCurated = activeMode === 'curated' && Boolean(activeJob);

  return (
    <aside className="cv-editor no-print" style={style}>
      {/* CURATION MODE BANNER */}
      {isCurated && activeJob && (
        <div className="curation-editor-banner">
          <div className="curation-banner-top">
            <div className="curation-banner-role">
              <span>🎯 Vaga: {activeJob.job.roleTitle}</span>
              {activeJob.job.company && <small style={{ opacity: 0.7 }}>({activeJob.job.company})</small>}
            </div>
            <div className="curation-banner-badges">
              <span className="curation-banner-score">{activeJob.curation.matchScore}% Match ATS</span>
              <span className="curation-a4-tag">1 Página A4</span>
            </div>
          </div>
          <p className="curation-banner-helper">
            {activeJob.curation.tailoredObjective}
          </p>
          {activeJob.curation.matchedKeywords.length > 0 && (
            <div className="curation-kw-chips">
              {activeJob.curation.matchedKeywords.slice(0, 8).map(kw => (
                <span key={kw} className="curation-kw-chip">✓ {kw}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 1. VISUAL & ESTILO */}
      <FormSection
        title="Visual & Estilo"
        isOpen={openSections.style}
        onToggle={() => toggleSection('style')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
        }
      >
        <StyleForm styleData={data.style} onChangeStyle={onChangeStyle} />
      </FormSection>

      {/* 2. DADOS PESSOAIS */}
      <FormSection
        title="Dados Pessoais"
        isOpen={openSections.personal}
        onToggle={() => toggleSection('personal')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        }
      >
        <PersonalForm personalData={data.personal} onChangePersonal={onChangePersonal} />
      </FormSection>

      {/* 3. OBJETIVO / RESUMO */}
      <FormSection
        title="Objetivo / Resumo Profissional"
        isOpen={openSections.objective}
        onToggle={() => toggleSection('objective')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        }
      >
        <ObjectiveForm objective={data.objective} onChangeObjective={onChangeObjective} />
      </FormSection>

      {/* 4. EXPERIÊNCIA PROFISSIONAL */}
      <FormSection
        title="Experiência Profissional"
        isOpen={openSections.experience}
        onToggle={() => toggleSection('experience')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        }
      >
        <ExperienceForm 
          experienceList={data.experience}
          onAddExperience={onAddExperience}
          onUpdateExperience={onUpdateExperience}
          onRemoveExperience={onRemoveExperience}
          onMoveExperience={onMoveExperience}
          curationMap={isCurated ? activeJob?.curation.experience : undefined}
          onToggleInclusion={(id) => onToggleItemInclusion?.('experience', id)}
          onToggleTailoredText={(id) => onToggleTailoredText?.('experience', id)}
        />
      </FormSection>

      {/* 5. ACADÊMICO */}
      <FormSection
        title="Formação Acadêmica"
        isOpen={openSections.education}
        onToggle={() => toggleSection('education')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
          </svg>
        }
      >
        <EducationForm 
          educationList={data.education}
          onAddEducation={onAddEducation}
          onUpdateEducation={onUpdateEducation}
          onRemoveEducation={onRemoveEducation}
          onMoveEducation={onMoveEducation}
          curationMap={isCurated ? activeJob?.curation.education : undefined}
          onToggleInclusion={(id) => onToggleItemInclusion?.('education', id)}
        />
      </FormSection>

      {/* 6. PROJETOS PESSOAIS */}
      <FormSection
        title="Projetos Pessoais"
        isOpen={openSections.projects}
        onToggle={() => toggleSection('projects')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        }
      >
        <ProjectsForm 
          projectsList={data.projects || []}
          onAddProject={onAddProject}
          onUpdateProject={onUpdateProject}
          onRemoveProject={onRemoveProject}
          onMoveProject={onMoveProject}
          curationMap={isCurated ? activeJob?.curation.projects : undefined}
          onToggleInclusion={(id) => onToggleItemInclusion?.('projects', id)}
          onToggleTailoredText={(id) => onToggleTailoredText?.('projects', id)}
        />
      </FormSection>

      {/* 7. CERTIFICADOS */}
      <FormSection
        title="Certificados"
        isOpen={openSections.certificates}
        onToggle={() => toggleSection('certificates')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
          </svg>
        }
      >
        <CertificatesForm 
          certificatesList={data.certificates}
          onAddCertificate={onAddCertificate}
          onUpdateCertificate={onUpdateCertificate}
          onRemoveCertificate={onRemoveCertificate}
          onMoveCertificate={onMoveCertificate}
          curationMap={isCurated ? activeJob?.curation.certificates : undefined}
          onToggleInclusion={(id) => onToggleItemInclusion?.('certificates', id)}
        />
      </FormSection>

      {/* 8. COMPETÊNCIAS / SKILLS */}
      <FormSection
        title="Competências (Skills)"
        isOpen={openSections.skills}
        onToggle={() => toggleSection('skills')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        }
      >
        <SkillsForm 
          skillsList={data.skills}
          onAddSkill={onAddSkill}
          onRemoveSkill={onRemoveSkill}
        />
      </FormSection>

      {/* 9. IDIOMAS */}
      <FormSection
        title="Idiomas"
        isOpen={openSections.languages}
        onToggle={() => toggleSection('languages')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        }
      >
        <LanguagesForm 
          languagesList={data.languages}
          onAddLanguage={onAddLanguage}
          onUpdateLanguage={onUpdateLanguage}
          onRemoveLanguage={onRemoveLanguage}
        />
      </FormSection>
    </aside>
  );
}
