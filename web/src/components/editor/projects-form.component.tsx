import { ProjectItem, ItemCuration } from '../../types/cv.model';

interface ProjectsFormProps {
  projectsList: ProjectItem[];
  onAddProject: () => void;
  onUpdateProject: (id: string, field: keyof ProjectItem, value: string) => void;
  onRemoveProject: (id: string) => void;
  onMoveProject: (index: number, direction: number) => void;
  curationMap?: Record<string, ItemCuration>;
  onToggleInclusion?: (id: string) => void;
  onToggleTailoredText?: (id: string) => void;
}

export default function ProjectsForm({
  projectsList,
  onAddProject,
  onUpdateProject,
  onRemoveProject,
  onMoveProject,
  curationMap,
  onToggleInclusion,
  onToggleTailoredText
}: ProjectsFormProps) {
  return (
    <div className="section-list">
      {projectsList.map((proj, index) => {
        const itemCur = curationMap ? curationMap[proj.id] : undefined;
        const isIncluded = itemCur ? itemCur.included : true;
        const hasTailoredText = Boolean(itemCur?.tailoredDescription);
        const usingTailored = itemCur?.useTailoredText ?? true;

        return (
          <div key={proj.id} className={`item-card ${curationMap && !isIncluded ? 'is-excluded' : ''}`}>
            {curationMap && (
              <div className="item-curation-bar">
                <button
                  type="button"
                  className={`item-toggle-btn ${isIncluded ? 'included' : 'excluded'}`}
                  onClick={() => onToggleInclusion?.(proj.id)}
                  title="Ativar ou ocultar este projeto na folha A4 deste currículo"
                >
                  {isIncluded ? '✓ No Currículo A4' : '✕ Oculto no A4'}
                </button>

                {itemCur?.relevanceScore !== undefined && (
                  <span className="item-relevance-tag">
                    Afinidade: {itemCur.relevanceScore}%
                  </span>
                )}

                {hasTailoredText && (
                  <button
                    type="button"
                    className="btn-toggle-text"
                    onClick={() => onToggleTailoredText?.(proj.id)}
                    title="Alternar entre o texto original e o texto customizado com palavras-chave pela IA"
                  >
                    {usingTailored ? '⚡ Texto IA Ativo' : '🔄 Texto Original'}
                  </button>
                )}
              </div>
            )}

            <div className="item-card-header">
              <span className="item-card-title">{proj.name || 'Projeto sem nome'}</span>
              <div className="item-card-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onMoveProject(index, -1)}
                  disabled={index === 0}
                  title="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onMoveProject(index, 1)}
                  disabled={index === projectsList.length - 1}
                  title="Mover para baixo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="icon-btn btn-danger-outline-icon"
                  onClick={() => onRemoveProject(proj.id)}
                  title="Excluir"
                >
                  🗑
                </button>
              </div>
            </div>

            <div className="item-card-body">
              <div className="form-group-row">
                <div className="form-group">
                  <label>Nome do Projeto</label>
                  <input
                    type="text"
                    placeholder="Ex: Plataforma E-commerce Open Source"
                    value={proj.name}
                    onChange={(e) => onUpdateProject(proj.id, 'name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Função / Papel</label>
                  <input
                    type="text"
                    placeholder="Ex: Desenvolvedor Principal / Criador"
                    value={proj.role}
                    onChange={(e) => onUpdateProject(proj.id, 'role', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Link / Repositório (sem https://)</label>
                  <input
                    type="text"
                    placeholder="Ex: github.com/seu-user/projeto"
                    value={proj.link}
                    onChange={(e) => onUpdateProject(proj.id, 'link', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Período / Ano</label>
                  <input
                    type="text"
                    placeholder="Ex: 2024 ou 2023 - Presente"
                    value={proj.startDate}
                    onChange={(e) => onUpdateProject(proj.id, 'startDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descrição & Tecnologias</label>
                <textarea
                  rows={2}
                  placeholder="Descreva o que o projeto resolve, impacto e tecnologias usadas (ex: React, Node, Tailwind...)"
                  value={proj.description}
                  onChange={(e) => onUpdateProject(proj.id, 'description', e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      })}
      
      <button type="button" className="btn btn-add" onClick={onAddProject}>
        + Adicionar Projeto
      </button>
    </div>
  );
}
