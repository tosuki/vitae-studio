import { EducationItem } from '../../types/cv';

interface EducationPreviewProps {
  educationList: EducationItem[];
}

export default function EducationPreview({ educationList }: EducationPreviewProps) {
  const formatPeriod = (start: string, end: string) => {
    if (!start && !end) return '';
    const startStr = start || '';
    const endStr = end || 'Presente';
    return `${startStr} — ${endStr}`;
  };

  return (
    <section className="cv-section">
      <h2 className="cv-section-title">Formação Acadêmica</h2>
      <div className="cv-section-divider"></div>
      <div className="cv-section-content education-list">
        {educationList.map((edu) => (
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
  );
}
