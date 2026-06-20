import { useState, useEffect, useRef } from 'react';

export default function CVPreview({ data }) {
  const { personal, objective, experience, education, certificates, skills, languages, style } = data;
  const containerRef = useRef(null);
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

  // Helper to format date range
  const formatPeriod = (start, end) => {
    if (!start && !end) return '';
    const startStr = start || '';
    const endStr = end || 'Presente';
    return `${startStr} — ${endStr}`;
  };

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

  // Inline CSS variables derived from user choice
  const previewStyle = {
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
        <header className="cv-header">
          <h1 className="cv-name">{personal.fullName || 'Seu Nome Completo'}</h1>
          {personal.title && <p className="cv-title">{personal.title}</p>}
          
          <div className="cv-contact-info">
            {personal.email && (
              <span className="cv-contact-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                {personal.email}
              </span>
            )}
            {personal.phone && (
              <span className="cv-contact-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                {personal.phone}
              </span>
            )}
            {personal.location && (
              <span className="cv-contact-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {personal.location}
              </span>
            )}
            {personal.linkedin && (
              <span className="cv-contact-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
                {personal.linkedin}
              </span>
            )}
            {personal.github && (
              <span className="cv-contact-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
                {personal.github}
              </span>
            )}
          </div>
        </header>

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
        {experience.length > 0 && (
          <section className="cv-section">
            <h2 className="cv-section-title">Experiência Profissional</h2>
            <div className="cv-section-divider"></div>
            <div className="cv-section-content experience-list">
              {experience.map((exp) => (
                <div key={exp.id} className="cv-experience-item">
                  <div className="cv-item-header">
                    <div className="cv-item-title-group">
                      <span className="cv-item-role">{exp.role}</span>
                      <span className="cv-item-separator">|</span>
                      <span className="cv-item-company">{exp.company}</span>
                    </div>
                    <div className="cv-item-meta-group">
                      <span className="cv-item-date">{formatPeriod(exp.startDate, exp.endDate)}</span>
                      {exp.location && (
                        <>
                          <span className="cv-item-meta-separator">•</span>
                          <span className="cv-item-location">{exp.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {exp.description && (
                    <div className="cv-item-description">
                      {exp.description.split('\n').map((line, idx) => {
                        const cleanLine = line.trim();
                        if (cleanLine.startsWith('-') || cleanLine.startsWith('•')) {
                          return (
                            <li key={idx} className="cv-bullet-point">
                              {cleanLine.substring(1).trim()}
                            </li>
                          );
                        }
                        return <p key={idx} className="cv-text-paragraph">{line}</p>;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FORMAÇÃO ACADÊMICA */}
        {education.length > 0 && (
          <section className="cv-section">
            <h2 className="cv-section-title">Formação Acadêmica</h2>
            <div className="cv-section-divider"></div>
            <div className="cv-section-content education-list">
              {education.map((edu) => (
                <div key={edu.id} className="cv-education-item">
                  <div className="cv-item-header">
                    <div className="cv-item-title-group">
                      <span className="cv-item-degree">{edu.degree}</span>
                      <span className="cv-item-separator">|</span>
                      <span className="cv-item-institution">{edu.institution}</span>
                    </div>
                    <span className="cv-item-date">{formatPeriod(edu.startDate, edu.endDate)}</span>
                  </div>
                  {edu.description && <p className="cv-item-description-text">{edu.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CERTIFICADOS */}
        {certificates.length > 0 && (
          <section className="cv-section">
            <h2 className="cv-section-title">Certificados</h2>
            <div className="cv-section-divider"></div>
            <div className="cv-section-content certificates-grid">
              {certificates.map((cert) => (
                <div key={cert.id} className="cv-certificate-item">
                  <div className="cv-cert-main">
                    <span className="cv-cert-name">{cert.name}</span>
                    <span className="cv-cert-org"> — {cert.organization}</span>
                  </div>
                  {cert.date && <span className="cv-cert-date">{cert.date}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* COMPETÊNCIAS & IDIOMAS (DUAS COLUNAS LADO A LADO PARA OTIMIZAR ESPAÇO) */}
        {(skills.length > 0 || languages.length > 0) && (
          <div className="cv-double-column-section">
            {/* COMPETÊNCIAS */}
            {skills.length > 0 && (
              <section className="cv-section cv-flex-1">
                <h2 className="cv-section-title">Competências</h2>
                <div className="cv-section-divider"></div>
                <div className="cv-section-content">
                  <div className="cv-skills-grid">
                    {skills.map((skill, index) => (
                      <span key={index} className="cv-skill-pill">{skill}</span>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* IDIOMAS */}
            {languages.length > 0 && (
              <section className="cv-section cv-flex-1">
                <h2 className="cv-section-title">Idiomas</h2>
                <div className="cv-section-divider"></div>
                <div className="cv-section-content">
                  <div className="cv-languages-list">
                    {languages.map((lang) => (
                      <div key={lang.id} className="cv-lang-item">
                        <span className="cv-lang-name">{lang.name}</span>
                        <span className="cv-lang-level">{lang.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
