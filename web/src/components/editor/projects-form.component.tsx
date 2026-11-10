import { ProjectItem } from '../../types/cv.model';

interface ProjectsFormProps {
  projectsList: ProjectItem[];
  onAddProject: () => void;
  onUpdateProject: (id: string, field: keyof ProjectItem, value: string) => void;
  onRemoveProject: (id: string) => void;
  onMoveProject: (index: number, direction: number) => void;
}

export default function ProjectsForm({
  projectsList,
  onAddProject,
  onUpdateProject,
  onRemoveProject,
  onMoveProject
}: ProjectsFormProps) {
  return (
    <div className="section-list">
      {projectsList.map((proj, index) => (
        <div key={proj.id} className="item-card">
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
                <label>Função / Tecnologias</label>
                <input
                  type="text"
                  placeholder="Ex: Criador & Full Stack | Next.js, Node.js"
                  value={proj.role}
                  onChange={(e) => onUpdateProject(proj.id, 'role', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Link / Repositório</label>
              <input
                type="text"
                placeholder="Ex: github.com/seu-usuario/meu-projeto"
                value={proj.link}
                onChange={(e) => onUpdateProject(proj.id, 'link', e.target.value)}
              />
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Início</label>
                <input
                  type="text"
                  placeholder="Ex: 2024 ou 01/2024"
                  value={proj.startDate}
                  onChange={(e) => onUpdateProject(proj.id, 'startDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Término (deixe em branco se em andamento)</label>
                <input
                  type="text"
                  placeholder="Ex: Atual, 2024 ou Em andamento"
                  value={proj.endDate}
                  onChange={(e) => onUpdateProject(proj.id, 'endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Descrição e Conquistas (Suporta tópicos com "-")</label>
              <textarea
                rows={3}
                placeholder="Ex: - Desenvolveu solução de alto tráfego com 10k acessos/mês.&#10;- Implementou autenticação segura e pagamentos via Stripe."
                value={proj.description}
                onChange={(e) => onUpdateProject(proj.id, 'description', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="btn-secondary w-full" onClick={onAddProject}>
        + Adicionar Projeto
      </button>
    </div>
  );
}
