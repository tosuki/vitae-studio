import { EducationItem, ItemCuration } from '../../types/cv.model';

interface EducationFormProps {
  educationList: EducationItem[];
  onAddEducation: () => void;
  onUpdateEducation: (id: string, field: keyof EducationItem, value: string) => void;
  onRemoveEducation: (id: string) => void;
  onMoveEducation: (index: number, direction: number) => void;
  curationMap?: Record<string, ItemCuration>;
  onToggleInclusion?: (id: string) => void;
}

export default function EducationForm({
  educationList,
  onAddEducation,
  onUpdateEducation,
  onRemoveEducation,
  onMoveEducation,
  curationMap,
  onToggleInclusion
}: EducationFormProps) {
  return (
    <div className="section-list">
      {educationList.map((edu, index) => {
        const itemCur = curationMap ? curationMap[edu.id] : undefined;
        const isIncluded = itemCur ? itemCur.included : true;

        return (
          <div key={edu.id} className={`item-card ${curationMap && !isIncluded ? 'is-excluded' : ''}`}>
            {curationMap && (
              <div className="item-curation-bar">
                <button
                  type="button"
                  className={`item-toggle-btn ${isIncluded ? 'included' : 'excluded'}`}
                  onClick={() => onToggleInclusion?.(edu.id)}
                  title="Ativar ou ocultar esta formação na folha A4 deste currículo"
                >
                  {isIncluded ? '✓ No Currículo A4' : '✕ Oculto no A4'}
                </button>
                {itemCur?.relevanceScore !== undefined && (
                  <span className="item-relevance-tag">
                    Afinidade: {itemCur.relevanceScore}%
                  </span>
                )}
              </div>
            )}

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
                    placeholder="Ex: Universidade de São Paulo"
                    value={edu.institution}
                    onChange={(e) => onUpdateEducation(edu.id, 'institution', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Grau / Curso</label>
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
                    placeholder="Ex: 2018"
                    value={edu.startDate}
                    onChange={(e) => onUpdateEducation(edu.id, 'startDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Fim (Ano)</label>
                  <input
                    type="text"
                    placeholder="Ex: 2022 ou Presente"
                    value={edu.endDate}
                    onChange={(e) => onUpdateEducation(edu.id, 'endDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descrição / Detalhes</label>
                <textarea
                  rows={2}
                  placeholder="Atividades extracurriculares, intercâmbios, projetos acadêmicos..."
                  value={edu.description}
                  onChange={(e) => onUpdateEducation(edu.id, 'description', e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      })}
      
      <button type="button" className="btn btn-add" onClick={onAddEducation}>
        + Adicionar Formação
      </button>
    </div>
  );
}
