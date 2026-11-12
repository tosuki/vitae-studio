import { useState, useEffect, useRef, CSSProperties } from 'react';
import HeaderPreview from './header-preview.component';
import ExperiencePreview from './experience-preview.component';
import EducationPreview from './education-preview.component';
import ProjectsPreview from './projects-preview.component';
import CertificatesPreview from './certificates-preview.component';
import SkillsLanguagesPreview from './skills-languages-preview.component';
import { CVData } from '../../types/cv.model';
import './cv-preview.component.css';

interface CVPreviewProps {
  data: CVData;
}

const A4_SAFE_HEIGHT_PX = 1100; // 297mm = 1122px a 96 DPI (deixa ~5.5mm de margem de segurança contra spillover)

export default function CVPreview({ data }: CVPreviewProps) {
  const { personal, objective, experience, education, projects, certificates, skills, languages, style } = data;
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sheetHeight, setSheetHeight] = useState(A4_SAFE_HEIGHT_PX);

  useEffect(() => {
    const updateScaleAndHeight = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 32;
      if (containerWidth < 794) {
        setScale(containerWidth / 794);
      } else {
        setScale(1);
      }

      if (sheetRef.current) {
        setSheetHeight(sheetRef.current.scrollHeight);
      }
    };

    updateScaleAndHeight();
    
    const observer = new ResizeObserver(updateScaleAndHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    if (sheetRef.current) {
      observer.observe(sheetRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [data]);

  // Get font family class name
  const getFontClass = () => {
    switch (style.fontFamily) {
      case 'lora': return 'font-serif-lora';
      case 'roboto': return 'font-sans-roboto';
      case 'inter':
      default:
        return 'font-sans-inter';
    }
  };

  // Inline CSS variables derived from style settings
  interface PreviewStyle extends CSSProperties {
    '--preview-accent'?: string;
    '--preview-spacing-multiplier'?: string;
    '--preview-line-height'?: string;
  }

  const previewStyle: PreviewStyle = {
    '--preview-accent': style.accentColor,
    '--preview-spacing-multiplier': style.spacing === 'compact' ? '0.72' : style.spacing === 'relaxed' ? '1.3' : '1.0',
    '--preview-line-height': style.spacing === 'compact' ? '1.33' : style.spacing === 'relaxed' ? '1.5' : '1.42',
  };

  const isOverflowing = sheetHeight > A4_SAFE_HEIGHT_PX;

  return (
    <main className="cv-preview-container" ref={containerRef}>
      <div className="cv-preview-wrapper">
        <div className={`a4-page-indicator no-print ${isOverflowing ? 'overflow' : 'perfect'}`}>
          {isOverflowing ? (
            <span>⚠️ Atenção: Conteúdo ultrapassou 1 folha A4 ({sheetHeight}px / {A4_SAFE_HEIGHT_PX}px). Desative algum item para manter o padrão de 1 página.</span>
          ) : (
            <span>✓ Encaixe Perfeito: 1 Folha A4 ({sheetHeight}px / {A4_SAFE_HEIGHT_PX}px)</span>
          )}
        </div>

        <div 
          ref={sheetRef}
          className={`cv-preview-sheet ${getFontClass()} theme-${style.theme}`} 
          style={{
            ...previewStyle,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            marginBottom: `calc(1122px * (1 - ${scale}) * -1)`
          }}
          id="cv-print-area"
        >
          {/* CABEÇALHO */}
          <HeaderPreview personal={personal} />

          {/* OBJETIVO */}
          {objective && (
            <section className="cv-section" data-section="summary">
              <h2 className="cv-section-title">Objetivo Profissional</h2>
              <div className="cv-section-divider"></div>
              <div className="cv-section-content">
                <p className="cv-objective-text">{objective}</p>
              </div>
            </section>
          )}

          {/* EXPERIÊNCIA PROFISSIONAL */}
          {experience.length > 0 && <ExperiencePreview experienceList={experience} />}

          {/* FORMAÇÃO ACADÊMICA */}
          {education.length > 0 && <EducationPreview educationList={education} />}

          {/* PROJETOS PESSOAIS */}
          {projects && projects.length > 0 && <ProjectsPreview projectList={projects} />}

          {/* CERTIFICADOS */}
          {certificates.length > 0 && <CertificatesPreview certificatesList={certificates} />}

          {/* COMPETÊNCIAS & IDIOMAS */}
          {(skills.length > 0 || languages.length > 0) && (
            <SkillsLanguagesPreview skillsList={skills} languagesList={languages} />
          )}
        </div>
      </div>
    </main>
  );
}
