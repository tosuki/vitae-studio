import { ProjectItem } from '../../types/cv.model';

interface ProjectsPreviewProps {
  projectList: ProjectItem[];
}

export default function ProjectsPreview({ projectList }: ProjectsPreviewProps) {
  const formatPeriod = (start: string, end: string) => {
    if (!start && !end) return '';
    const startStr = start || '';
    const endStr = end || 'Presente';
    return `${startStr} — ${endStr}`;
  };

  return (
    <section className="cv-section" data-section="projects">
      <h2 className="cv-section-title">Projetos Pessoais</h2>
      <div className="cv-section-divider"></div>
      <div className="cv-section-content projects-list">
        {projectList.map((proj) => (
          <div key={proj.id} className="cv-project-item">
            <div className="cv-item-header">
              <div className="cv-item-title-group">
                <span className="cv-item-role">{proj.name}</span>
                {proj.role && (
                  <>
                    <span className="cv-item-separator">|</span>
                    <span className="cv-item-company">{proj.role}</span>
                  </>
                )}
              </div>
              <div className="cv-item-meta-group">
                {formatPeriod(proj.startDate, proj.endDate) && (
                  <span className="cv-item-date">{formatPeriod(proj.startDate, proj.endDate)}</span>
                )}
                {proj.link && (
                  <>
                    {formatPeriod(proj.startDate, proj.endDate) && <span className="cv-item-meta-separator">•</span>}
                    <a
                      href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cv-project-link"
                    >
                      {proj.link.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </>
                )}
              </div>
            </div>
            {proj.description && (
              <div className="cv-item-description">
                {proj.description.split('\n').map((line, idx) => {
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
