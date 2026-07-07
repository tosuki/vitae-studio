import { useState, useEffect, useRef, CSSProperties } from 'react';
import HeaderPreview from './header-preview.component';
import ExperiencePreview from './experience-preview.component';
import EducationPreview from './education-preview.component';
import CertificatesPreview from './certificates-preview.component';
import SkillsLanguagesPreview from './skills-languages-preview.component';
import { CVData } from '../../types/cv.model';
import './cv-preview.component.css';

interface CVPreviewProps {
  data: CVData;
}

export default function CVPreview({ data }: CVPreviewProps) {
  const { personal, objective, experience, education, certificates, skills, languages, style } = data;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 32;
      if (containerWidth < 793) {
        setScale(containerWidth / 793);
      } else {
        setScale(1);
      }
    };

    updateScale();
    
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

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
  }

  const previewStyle: PreviewStyle = {
    '--preview-accent': style.accentColor,
    '--preview-spacing-multiplier': style.spacing === 'compact' ? '0.7' : style.spacing === 'relaxed' ? '1.3' : '1.0',
  };

  return (
    <main className="cv-preview-container no-print" ref={containerRef}>
      <div 
        className={`cv-preview-sheet ${getFontClass()} theme-${style.theme}`} 
        style={{
          ...previewStyle,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          marginBottom: `calc(1120px * (1 - ${scale}) * -1)`
        }}
        id="cv-print-area"
      >
        {/* CABEÇALHO */}
        <HeaderPreview personal={personal} />

        {/* OBJETIVO */}
        {objective && (
          <section className="cv-section">
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

        {/* CERTIFICADOS */}
        {certificates.length > 0 && <CertificatesPreview certificatesList={certificates} />}

        {/* COMPETÊNCIAS & IDIOMAS */}
        {(skills.length > 0 || languages.length > 0) && (
          <SkillsLanguagesPreview skillsList={skills} languagesList={languages} />
        )}
      </div>
    </main>
  );
}
