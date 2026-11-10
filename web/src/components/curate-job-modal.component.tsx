import { useState, useEffect } from "react";
import { useCuration } from "../hooks/curation.hook";
import { CVData, JobTarget, TargetedCuration } from "../types/cv.model";
import "./curate-job-modal.component.css";

interface CurateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvData: CVData;
  onApplyCuration: (job: JobTarget, curation: TargetedCuration) => void;
  isAIConfigured?: boolean;
  onOpenSettings?: () => void;
}

export default function CurateJobModal({
  isOpen,
  onClose,
  cvData,
  onApplyCuration,
  isAIConfigured = true,
  onOpenSettings
}: CurateJobModalProps) {
  const [roleTitle, setRoleTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    startCuration,
    reset,
    progress,
    statusLabel,
    isPending,
    isSuccess,
    isError,
    errorMessage,
    curationResult
  } = useCuration();

  useEffect(() => {
    if (!isOpen) {
      setRoleTitle("");
      setCompany("");
      setJobDescription("");
      setValidationError(null);
      reset();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStart = () => {
    setValidationError(null);

    if (!isAIConfigured) {
      setValidationError("Configure um provedor de IA antes de iniciar a curadoria.");
      return;
    }

    const trimmedTitle = roleTitle.trim();
    if (!trimmedTitle) {
      setValidationError("Informe o cargo alvo desejado.");
      return;
    }

    const trimmedDesc = jobDescription.trim();
    if (trimmedDesc.length < 20) {
      setValidationError("A descrição da vaga precisa ter no mínimo 20 caracteres para uma curadoria precisa.");
      return;
    }

    startCuration(
      {
        roleTitle: trimmedTitle,
        company: company.trim() || undefined,
        jobDescription: trimmedDesc
      },
      cvData
    );
  };

  const handleApply = () => {
    if (curationResult) {
      const jobTarget: JobTarget = {
        id: `job-${Date.now()}`,
        roleTitle: roleTitle.trim(),
        company: company.trim() || undefined,
        jobDescription: jobDescription.trim(),
        createdAt: Date.now()
      };

      onApplyCuration(jobTarget, curationResult);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isPending) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop no-print" onClick={handleBackdropClick}>
      <div className="curate-modal-container">
        <div className="curate-modal-header">
          <div className="curate-modal-title-area">
            <h2>🎯 Criar Currículo para Vaga</h2>
            <span className="curate-modal-badge">1 Página A4</span>
          </div>
          <button
            type="button"
            className="curate-modal-close-btn"
            onClick={onClose}
            disabled={isPending}
            aria-label="Fechar"
          >
            &times;
          </button>
        </div>

        <div className="curate-modal-body">
          <div className="curate-a4-pill-notice">
            <span>
              ⚡ <strong>Calibração Automática de 1 Página:</strong> A IA analisa seu Perfil Mestre completo, seleciona as experiências e projetos mais fortes para a vaga e enxuga os textos para caber com precisão cirúrgica em <strong>1 folha A4</strong>.
            </span>
          </div>

          {!isAIConfigured && (
            <div className="curate-error-message" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Nenhum provedor de IA configurado.</span>
              {onOpenSettings && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                  onClick={onOpenSettings}
                >
                  Configurar IA
                </button>
              )}
            </div>
          )}

          {validationError && (
            <div className="curate-error-message">{validationError}</div>
          )}

          {isError && errorMessage && (
            <div className="curate-error-message">{errorMessage}</div>
          )}

          {!isSuccess && (
            <>
              <div className="curate-form-group">
                <label htmlFor="curate-role">Cargo Alvo *</label>
                <input
                  id="curate-role"
                  type="text"
                  className="curate-input"
                  placeholder="Ex: Desenvolvedor Frontend Senior, Tech Lead..."
                  value={roleTitle}
                  onChange={e => setRoleTitle(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="curate-form-group">
                <label htmlFor="curate-company">Empresa (Opcional)</label>
                <input
                  id="curate-company"
                  type="text"
                  className="curate-input"
                  placeholder="Ex: Nubank, Mercado Livre, Google..."
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="curate-form-group">
                <label htmlFor="curate-desc">Descrição / Requisitos da Vaga *</label>
                <textarea
                  id="curate-desc"
                  className="curate-textarea"
                  placeholder="Cole aqui a descrição copiada do LinkedIn, Gupy, Glassdoor ou do anúncio da vaga..."
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </>
          )}

          {isPending && (
            <div className="curate-progress-box">
              <div className="curate-status-text">
                <div className="curate-spinner" />
                <span>{statusLabel}</span>
              </div>
              <div className="curate-progress-bar-bg">
                <div
                  className="curate-progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {isSuccess && curationResult && (
            <div className="curate-summary-card">
              <div className="curate-score-row">
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                  Aderência Calculada com a Vaga:
                </strong>
                <span className="curate-score-badge">
                  {curationResult.matchScore}% Match ATS
                </span>
              </div>

              <p style={{ margin: '6px 0', fontSize: '0.85rem', color: 'var(--db-text-secondary)' }}>
                {curationResult.tailoredObjective}
              </p>

              {curationResult.matchedKeywords.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--db-text-secondary)' }}>
                    Palavras-chave encontradas:
                  </span>
                  <div className="curate-keywords-list">
                    {curationResult.matchedKeywords.slice(0, 8).map(kw => (
                      <span key={kw} className="curate-kw-tag">✓ {kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="curate-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </button>

          {!isSuccess ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStart}
              disabled={isPending}
            >
              {isPending ? "Processando Curadoria..." : "Gerar Currículo 1 Página A4"}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApply}
            >
              Ver Currículo sob Medida 🎯
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
