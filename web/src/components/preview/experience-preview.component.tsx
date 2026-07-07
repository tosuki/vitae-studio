import { ExperienceItem } from '../../types/cv.model';

interface ExperiencePreviewProps {
  experienceList: ExperienceItem[];
}

export default function ExperiencePreview({ experienceList }: ExperiencePreviewProps) {
  const formatPeriod = (start: string, end: string) => {
    if (!start && !end) return '';
    const startStr = start || '';
    const endStr = end || 'Presente';
    return `${startStr} — ${endStr}`;
  };

  return (
    <section className="cv-section">
      <h2 className="cv-section-title">Experiência Profissional</h2>
      <div className="cv-section-divider"></div>
      <div className="cv-section-content experience-list">
        {experienceList.map((exp) => (
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
  );
}
