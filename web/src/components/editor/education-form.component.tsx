import { EducationItem } from '../../types/cv.model';

interface EducationFormProps {
  educationList: EducationItem[];
  onAddEducation: () => void;
  onUpdateEducation: (id: string, field: keyof EducationItem, value: string) => void;
  onRemoveEducation: (id: string) => void;
  onMoveEducation: (index: number, direction: number) => void;
}

export default function EducationForm({
  educationList,
  onAddEducation,
  onUpdateEducation,
  onRemoveEducation,
  onMoveEducation
}: EducationFormProps) {
  return (
    <div className="section-list">
      {educationList.map((edu, index) => (
        <div key={edu.id} className="item-card">
          <div className="item-card-header">
            <span className="item-card-title">{edu.institution || 'Instituição não informada'}</span>
            <div className="item-card-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => onMoveEducation(index, -1)}
                disabled={index === 0}
                title="Mover para cima"
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onMoveEducation(index, 1)}
                disabled={index === educationList.length - 1}
                title="Mover para baixo"
              >
                ↓
              </button>
              <button
                type="button"
                className="icon-btn btn-danger-outline-icon"
                onClick={() => onRemoveEducation(edu.id)}
                title="Excluir"
              >
                🗑
              </button>
            </div>
          </div>

          <div className="item-card-body">
            <div className="form-group-row">
              <div className="form-group">
                <label>Instituição</label>
                <input
                  type="text"
                  placeholder="Ex: USP"
                  value={edu.institution}
                  onChange={(e) => onUpdateEducation(edu.id, 'institution', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Título / Curso</label>
                <input
                  type="text"
                  placeholder="Ex: Bacharelado em Ciência da Computação"
                  value={edu.degree}
                  onChange={(e) => onUpdateEducation(edu.id, 'degree', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Início (Ano)</label>
                <input
                  type="text"
                  placeholder="Ex: 2017"
                  value={edu.startDate}
                  onChange={(e) => onUpdateEducation(edu.id, 'startDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Término (ou previsto)</label>
                <input
                  type="text"
                  placeholder="Ex: 2021"
                  value={edu.endDate}
                  onChange={(e) => onUpdateEducation(edu.id, 'endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Descrição / Detalhes (Opcional)</label>
              <textarea
                rows={2}
                placeholder="Destaques, notas, projetos acadêmicos importantes..."
                value={edu.description}
                onChange={(e) => onUpdateEducation(edu.id, 'description', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="btn btn-add" onClick={onAddEducation}>
        + Adicionar Formação
      </button>
    </div>
  );
}
