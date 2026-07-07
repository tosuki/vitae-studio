import { LanguageItem } from '../../types/cv.model';

interface SkillsLanguagesPreviewProps {
  skillsList: string[];
  languagesList: LanguageItem[];
}

export default function SkillsLanguagesPreview({ skillsList, languagesList }: SkillsLanguagesPreviewProps) {
  return (
    <div className="cv-double-column-section">
      {/* COMPETÊNCIAS */}
      {skillsList.length > 0 && (
        <section className="cv-section cv-flex-1">
          <h2 className="cv-section-title">Competências</h2>
          <div className="cv-section-divider"></div>
          <div className="cv-section-content">
            <div className="cv-skills-grid">
              {skillsList.map((skill, index) => (
                <span key={index} className="cv-skill-pill">{skill}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* IDIOMAS */}
      {languagesList.length > 0 && (
        <section className="cv-section cv-flex-1">
          <h2 className="cv-section-title">Idiomas</h2>
          <div className="cv-section-divider"></div>
          <div className="cv-section-content">
            <div className="cv-languages-list">
              {languagesList.map((lang) => (
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
  );
}
