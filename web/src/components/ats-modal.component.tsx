import { useState, useMemo } from 'react';
import { CVData } from '../types/cv.model';
import { AtsSeverity } from '../types/ats.model';
import { validateCVForATS, compareWithJobDescription } from '../service/ats-validator.service';
import './ats-modal.component.css';

interface AtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvData: CVData;
  onApplyAtsTheme: () => void;
  onPrint?: () => void;
}

export default function AtsModal({
  isOpen,
  onClose,
  cvData,
  onApplyAtsTheme,
  onPrint
}: AtsModalProps) {
  const [activeTab, setActiveTab] = useState<'checklist' | 'robot' | 'matcher'>('checklist');
  const [severityFilter, setSeverityFilter] = useState<'all' | AtsSeverity>('all');
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Compute live ATS report whenever cvData changes
  const report = useMemo(() => {
    return validateCVForATS(cvData);
  }, [cvData]);

  // Compute job keyword comparison if input provided
  const jobMatch = useMemo(() => {
    if (!jobDescriptionInput.trim()) return null;
    return compareWithJobDescription(cvData, jobDescriptionInput);
  }, [cvData, jobDescriptionInput]);

  if (!isOpen) return null;

  const filteredChecks = report.checks.filter((check) => {
    if (severityFilter === 'all') return true;
    return check.severity === severityFilter;
  });

  const handleCopyRobotText = async () => {
    try {
      await navigator.clipboard.writeText(report.robotPlainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isCurrentThemeAts = cvData.style.theme === 'ats';

  return (
    <div className="modal-backdrop no-print" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ats-modal-container">
        {/* HEADER */}
        <div className="ats-modal-header">
          <h3 className="ats-modal-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
            Validador de Compatibilidade ATS
          </h3>
          <button type="button" className="ats-modal-close-btn" onClick={onClose} aria-label="Fechar">
            &times;
          </button>
        </div>

        {/* BODY */}
        <div className="ats-modal-body">
          {/* SCORE BANNER */}
          <div className="ats-score-banner">
            <div className="ats-score-circle-wrapper">
              <div className={`ats-score-badge rating-${report.rating}`}>
                <span className="ats-score-number">{report.overallScore}</span>
                <span className="ats-score-total">/100</span>
              </div>
              <div className="ats-score-info">
                <div className="ats-score-label-row">
                  <span className="ats-score-label">Pontuação ATS</span>
                  <span className={`ats-rating-tag rating-${report.rating}`}>{report.ratingLabel}</span>
                </div>
                <p className="ats-score-desc">
                  {report.rating === 'excellent' && 'Seu currículo atende aos mais rígidos padrões de leitura automatizada.'}
                  {report.rating === 'good' && 'Estrutura compatível, com pequenas oportunidades de otimização de texto.'}
                  {report.rating === 'average' && 'Atenção: alguns itens podem dificultar a indexação ou triagem pelos robôs.'}
                  {report.rating === 'poor' && 'Crítico: dados essenciais ou estrutura ausente impedem aprovação na triagem.'}
                </p>
              </div>
            </div>

            <div className="ats-counts-group">
              <div className="ats-count-pill" title="Itens que passaram na validação">
                <span className="ats-count-val success">{report.passedCount}</span>
                <span className="ats-count-label">Aprovados</span>
              </div>
              <div className="ats-count-pill" title="Avisos de melhoria">
                <span className="ats-count-val warning">{report.warningIssuesCount}</span>
                <span className="ats-count-label">Avisos</span>
              </div>
              <div className="ats-count-pill" title="Erros críticos que desclassificam">
                <span className="ats-count-val critical">{report.criticalIssuesCount}</span>
                <span className="ats-count-label">Críticos</span>
              </div>
            </div>
          </div>

          {/* 1-CLICK FIX IF NOT ATS THEME */}
          {!isCurrentThemeAts && (
            <div className="ats-fix-callout">
              <div className="ats-fix-callout-text">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>
                  O tema atual não é de coluna única. Ative o <strong>Padrão ATS</strong> para garantir que robôs leiam todas as seções em ordem perfeita.
                </span>
              </div>
              <button
                type="button"
                className="ats-fix-btn"
                onClick={onApplyAtsTheme}
              >
                🎯 Ativar Layout ATS
              </button>
            </div>
          )}

          {/* TABS NAVIGATION */}
          <div className="ats-tabs-nav">
            <button
              type="button"
              className={`ats-tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
              onClick={() => setActiveTab('checklist')}
            >
              Checklist de Conformidade ({report.checks.length})
            </button>
            <button
              type="button"
              className={`ats-tab-btn ${activeTab === 'robot' ? 'active' : ''}`}
              onClick={() => setActiveTab('robot')}
            >
              Visão do Robô (Texto Puro ATS)
            </button>
            <button
              type="button"
              className={`ats-tab-btn ${activeTab === 'matcher' ? 'active' : ''}`}
              onClick={() => setActiveTab('matcher')}
            >
              Comparar com Vaga (Keywords)
            </button>
          </div>

          {/* TAB 1: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div>
              <div className="ats-filter-row">
                <button
                  type="button"
                  className={`ats-filter-btn ${severityFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSeverityFilter('all')}
                >
                  Todos ({report.checks.length})
                </button>
                <button
                  type="button"
                  className={`ats-filter-btn ${severityFilter === 'critical' ? 'active' : ''}`}
                  onClick={() => setSeverityFilter('critical')}
                >
                  Críticos ({report.criticalIssuesCount})
                </button>
                <button
                  type="button"
                  className={`ats-filter-btn ${severityFilter === 'warning' ? 'active' : ''}`}
                  onClick={() => setSeverityFilter('warning')}
                >
                  Avisos ({report.warningIssuesCount})
                </button>
                <button
                  type="button"
                  className={`ats-filter-btn ${severityFilter === 'success' ? 'active' : ''}`}
                  onClick={() => setSeverityFilter('success')}
                >
                  Aprovados ({report.passedCount})
                </button>
              </div>

              <div className="ats-checklist">
                {filteredChecks.map((item) => (
                  <div key={item.id} className="ats-check-item">
                    <div className={`ats-check-icon ${item.severity}`}>
                      {item.passed ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : item.severity === 'critical' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                          <line x1="12" y1="9" x2="12" y2="13"></line>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                      )}
                    </div>
                    <div className="ats-check-content">
                      <div className="ats-check-header">
                        <span className="ats-check-title">{item.title}</span>
                        <span className="ats-check-cat">{report.categories[item.category]?.label}</span>
                      </div>
                      <p className="ats-check-desc">{item.description}</p>
                      {item.suggestion && (
                        <div className="ats-check-suggestion">
                          💡 <strong>Dica:</strong> {item.suggestion}
                        </div>
                      )}
                      {item.autoFixAvailable && (
                        <div style={{ marginTop: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                            onClick={onApplyAtsTheme}
                          >
                            🎯 Aplicar Padrão ATS Agora
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: VISÃO DO ROBÔ */}
          {activeTab === 'robot' && (
            <div className="ats-robot-container">
              <div className="ats-robot-header">
                <p className="ats-robot-tip">
                  Abaixo está a representação em texto estruturado que os parsers ATS (Workable, Greenhouse, Taleo) extraem do seu currículo:
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopyRobotText}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  {copied ? '✓ Copiado!' : 'Copiar Texto Puro'}
                </button>
              </div>
              <pre className="ats-robot-box">{report.robotPlainText}</pre>
            </div>
          )}

          {/* TAB 3: MATCHER DE VAGA */}
          {activeTab === 'matcher' && (
            <div className="ats-matcher-container">
              <p className="ats-robot-tip">
                Cole abaixo a descrição de uma vaga de emprego ou lista de requisitos. O validador extrairá as principais palavras-chave e calculará a taxa de compatibilidade com seu currículo:
              </p>
              <textarea
                className="ats-matcher-textarea"
                placeholder="Cole aqui a descrição completa da vaga..."
                value={jobDescriptionInput}
                onChange={(e) => setJobDescriptionInput(e.target.value)}
              />

              {jobMatch && (
                <div className="ats-matcher-result">
                  <div className="ats-matcher-score-row">
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Compatibilidade de Keywords</span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: jobMatch.matchPercentage >= 70 ? '#10b981' : '#f59e0b' }}>
                      {jobMatch.matchPercentage}% de Match
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669', display: 'block', marginBottom: '6px' }}>
                      ✓ Palavras-chave Encontradas ({jobMatch.matchedKeywords.length}):
                    </span>
                    {jobMatch.matchedKeywords.length > 0 ? (
                      <div className="ats-pill-list">
                        {jobMatch.matchedKeywords.map((kw, i) => (
                          <span key={i} className="ats-match-pill matched">{kw}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Nenhuma correspondência exata encontrada.</span>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626', display: 'block', marginBottom: '6px' }}>
                      ✗ Palavras-chave Faltando no Currículo ({jobMatch.missingKeywords.length}):
                    </span>
                    {jobMatch.missingKeywords.length > 0 ? (
                      <div className="ats-pill-list">
                        {jobMatch.missingKeywords.map((kw, i) => (
                          <span key={i} className="ats-match-pill missing">{kw}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Parabéns! Todas as principais palavras-chave foram encontradas.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="ats-modal-footer">
          {!isCurrentThemeAts && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onApplyAtsTheme}
            >
              🎯 Aplicar Tema ATS
            </button>
          )}
          {onPrint && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onPrint();
              }}
            >
              Imprimir / Salvar PDF
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
