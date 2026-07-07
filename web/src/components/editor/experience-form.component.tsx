import { ExperienceItem } from '../../types/cv.model';

interface ExperienceFormProps {
  experienceList: ExperienceItem[];
  onAddExperience: () => void;
  onUpdateExperience: (id: string, field: keyof ExperienceItem, value: string) => void;
  onRemoveExperience: (id: string) => void;
  onMoveExperience: (index: number, direction: number) => void;
}

export default function ExperienceForm({
  experienceList,
  onAddExperience,
  onUpdateExperience,
  onRemoveExperience,
  onMoveExperience
}: ExperienceFormProps) {
  return (
    <div className="section-list">
      {experienceList.map((exp, index) => (
        <div key={exp.id} className="item-card">
          <div className="item-card-header">
            <span className="item-card-title">{exp.company || 'Empresa não informada'}</span>
            <div className="item-card-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => onMoveExperience(index, -1)}
                disabled={index === 0}
                title="Mover para cima"
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onMoveExperience(index, 1)}
                disabled={index === experienceList.length - 1}
                title="Mover para baixo"
              >
                ↓
              </button>
              <button
                type="button"
                className="icon-btn btn-danger-outline-icon"
                onClick={() => onRemoveExperience(exp.id)}
                title="Excluir"
              >
                🗑
              </button>
            </div>
          </div>

          <div className="item-card-body">
            <div className="form-group-row">
              <div className="form-group">
                <label>Empresa</label>
                <input
                  type="text"
                  placeholder="Ex: TechNova Solutions"
                  value={exp.company}
                  onChange={(e) => onUpdateExperience(exp.id, 'company', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Cargo</label>
                <input
                  type="text"
                  placeholder="Ex: Desenvolvedor Senior"
                  value={exp.role}
                  onChange={(e) => onUpdateExperience(exp.id, 'role', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Início (Mês/Ano)</label>
                <input
                  type="text"
                  placeholder="Ex: 2023-03 ou Março/23"
                  value={exp.startDate}
                  onChange={(e) => onUpdateExperience(exp.id, 'startDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Fim (Mês/Ano ou em branco para Presente)</label>
                <input
                  type="text"
                  placeholder="Ex: Presente, 2024-12"
                  value={exp.endDate}
                  onChange={(e) => onUpdateExperience(exp.id, 'endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Localização</label>
              <input
                type="text"
                placeholder="Ex: São Paulo, SP (Remoto)"
                value={exp.location}
                onChange={(e) => onUpdateExperience(exp.id, 'location', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Responsabilidades & Conquistas</label>
              <textarea
                rows={3}
                placeholder="Foque em realizações e conquistas usando tópicos (ex: - Liderança técnica no desenvolvimento...)"
                value={exp.description}
                onChange={(e) => onUpdateExperience(exp.id, 'description', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
      
      <button type="button" className="btn btn-add" onClick={onAddExperience}>
        + Adicionar Experiência
      </button>
    </div>
  );
}
