import { useState, useRef, useEffect } from 'react';
import { CuratedJobResume, ViewMode } from '../../types/cv.model';
import './baggage-menu.component.css';

interface BaggageMenuProps {
  activeMode: ViewMode;
  savedJobs: CuratedJobResume[];
  activeJobId: string | null;
  onSelectMaster: () => void;
  onSelectJob: (jobId: string) => void;
  onRemoveJob: (jobId: string) => void;
  onOpenCurateJob: () => void;
  onOpenLinkedinEnrichment: () => void;
}

export default function BaggageMenu({
  activeMode,
  savedJobs,
  activeJobId,
  onSelectMaster,
  onSelectJob,
  onRemoveJob,
  onOpenCurateJob,
  onOpenLinkedinEnrichment
}: BaggageMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeJob = savedJobs.find(item => item.job.id === activeJobId) || null;

  // Fecha o menu ao clicar fora ou pressionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectMaster = () => {
    onSelectMaster();
    setIsOpen(false);
  };

  const handleSelectJob = (jobId: string) => {
    onSelectJob(jobId);
    setIsOpen(false);
  };

  const handleCreateJob = () => {
    setIsOpen(false);
    onOpenCurateJob();
  };

  const handleCreateLinkedin = () => {
    setIsOpen(false);
    onOpenLinkedinEnrichment();
  };

  const handleRemove = (e: React.MouseEvent, jobId: string, roleTitle: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Deseja realmente excluir a bagagem "${roleTitle}"? Esta ação removerá apenas esta versão específica, mantendo sua Bagagem Mestra intacta.`
    );
    if (confirmed) {
      onRemoveJob(jobId);
    }
  };

  return (
    <div className="baggage-menu-wrapper" ref={containerRef}>
      {/* TRIGGER BUTTON (COMPACTO E MODERNO NA NAVBAR) */}
      <button
        type="button"
        className={`baggage-menu-trigger ${isOpen ? 'is-open' : ''} ${activeMode === 'curated' ? 'is-curated' : 'is-master'}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        title="Clique para alternar entre a Bagagem Mestra e suas versões por vaga"
      >
        <div className="trigger-icon-box">
          {activeMode === 'master' ? (
            <span className="trigger-emoji">💼</span>
          ) : (
            <span className="trigger-emoji">🎯</span>
          )}
        </div>

        <div className="trigger-text-block">
          <span className="trigger-label">
            {activeMode === 'master' ? 'Bagagem Mestra' : (activeJob?.job.roleTitle || 'Vaga Direcionada')}
          </span>
          {activeMode === 'curated' && activeJob && (
            <span className="trigger-score-pill">
              {activeJob.curation.matchScore}% Match
            </span>
          )}
        </div>

        {savedJobs.length > 0 && (
          <span className="trigger-count-badge" title={`${savedJobs.length} bagagens customizadas por vaga`}>
            {savedJobs.length + 1}
          </span>
        )}

        <svg
          className={`trigger-chevron ${isOpen ? 'rotate' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {/* DROPDOWN POPOVER FLUTUANTE */}
      {isOpen && (
        <div className="baggage-dropdown-panel animate-fade-down" role="menu">
          {/* HEADER */}
          <div className="baggage-dropdown-header">
            <div>
              <h4 className="dropdown-title">Minhas Bagagens</h4>
              <p className="dropdown-subtitle">
                Alterne entre o perfil completo e currículos direcionados
              </p>
            </div>
            <span className="dropdown-total-tag">
              {savedJobs.length + 1} {savedJobs.length === 0 ? 'versão' : 'versões'}
            </span>
          </div>

          <div className="baggage-dropdown-body">
            {/* ITEM 1: BAGAGEM MESTRA */}
            <div
              className={`baggage-card master-card ${activeMode === 'master' ? 'is-active' : ''}`}
              onClick={handleSelectMaster}
              role="menuitem"
            >
              <div className="baggage-card-left">
                <div className="card-icon-badge master-badge">
                  💼
                </div>
                <div className="card-info">
                  <div className="card-title-row">
                    <span className="card-title">Bagagem Mestra</span>
                    <span className="card-tag primary-tag">Base Completa</span>
                  </div>
                  <span className="card-desc">
                    Todo o seu histórico profissional acumulado
                  </span>
                </div>
              </div>

              {activeMode === 'master' && (
                <div className="card-active-check" title="Atualmente em edição">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              )}
            </div>

            {/* DIVISOR DE SEÇÃO */}
            <div className="baggage-section-divider">
              <span>CURRÍCULOS POR VAGA ({savedJobs.length})</span>
            </div>

            {/* LISTA DE VAGAS SALVAS */}
            <div className="baggage-jobs-list">
              {savedJobs.length === 0 ? (
                <div className="baggage-empty-state">
                  <div className="empty-icon">🎯</div>
                  <p className="empty-title">Nenhuma bagagem por vaga criada</p>
                  <p className="empty-desc">
                    Crie currículos de 1 página A4 customizados pela IA para vagas do LinkedIn ou descrições específicas.
                  </p>
                </div>
              ) : (
                savedJobs.map(entry => {
                  const isCurrent = activeMode === 'curated' && activeJobId === entry.job.id;
                  return (
                    <div
                      key={entry.job.id}
                      className={`baggage-card job-card ${isCurrent ? 'is-active' : ''}`}
                      onClick={() => handleSelectJob(entry.job.id)}
                      role="menuitem"
                    >
                      <div className="baggage-card-left">
                        <div className="card-icon-badge job-badge">
                          🎯
                        </div>
                        <div className="card-info">
                          <div className="card-title-row">
                            <span className="card-title">{entry.job.roleTitle}</span>
                            <span className="card-score-pill">
                              {entry.curation.matchScore}% Match
                            </span>
                          </div>
                          <span className="card-desc">
                            {entry.job.company || 'Vaga Direcionada'} • 1 pág A4
                          </span>
                        </div>
                      </div>

                      <div className="baggage-card-actions">
                        {isCurrent && (
                          <div className="card-active-check" title="Atualmente em edição">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn-card-remove"
                          onClick={(e) => handleRemove(e, entry.job.id, entry.job.roleTitle)}
                          title="Excluir esta bagagem"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* FOOTER DE AÇÕES RÁPIDAS */}
          <div className="baggage-dropdown-footer">
            <button
              type="button"
              className="btn-dropdown-action btn-curate"
              onClick={handleCreateJob}
              title="Gerar currículo de 1 página A4 calibrado para uma vaga com IA"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>+ Nova Bagagem para Vaga (1 pág A4)</span>
            </button>

            <button
              type="button"
              className="btn-dropdown-action btn-linkedin"
              onClick={handleCreateLinkedin}
              title="Criar nova bagagem a partir de uma vaga do LinkedIn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.62 1.62 0 0 0-1.62 1.62 1.63 1.63 0 0 0 1.62 1.63 1.62 1.62 0 0 0 1.62-1.63c0-.9-.73-1.62-1.62-1.62Z"></path>
              </svg>
              <span>+ Nova Bagagem via LinkedIn</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
