import { useState, useEffect } from "react"
import { useEnrichment } from "../hooks/enrichment.hook"
import { CVData } from "../types/cv.model"
import "./enrichment-modal.component.css"

interface EnrichmentModalProps {
    isOpen: boolean
    onClose: () => void
    cvData: CVData
    onApplyEnrichment: (enrichedCv: CVData) => void
}

export default function EnrichmentModal({ isOpen, onClose, cvData, onApplyEnrichment }: EnrichmentModalProps) {
    const [linkedinJobId, setLinkedinJobId] = useState("")
    const [validationError, setValidationError] = useState<string | null>(null)

    const {
        startEnrichment,
        reset,
        progress,
        statusLabel,
        isPending,
        isSuccess,
        isError,
        errorMessage,
        enrichedCV
    } = useEnrichment()

    // Reset internal state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setLinkedinJobId("")
            setValidationError(null)
            reset()
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleStart = () => {
        setValidationError(null)
        const trimmedId = linkedinJobId.trim()
        if (!trimmedId) {
            setValidationError("O ID da vaga é obrigatório.")
            return
        }

        // Valida se é numérico ou se o usuário colou a URL inteira
        let jobId = trimmedId
        if (trimmedId.includes("linkedin.com/jobs/view/")) {
            const matches = trimmedId.match(/view\/(\d+)/)
            if (matches && matches[1]) {
                jobId = matches[1]
            } else {
                setValidationError("Formato de URL do LinkedIn inválido. Forneça o ID numérico ou o link direto da vaga.")
                return
            }
        }

        startEnrichment(jobId, cvData)
    }

    const handleApply = () => {
        if (enrichedCV) {
            // Repassamos a estilização do currículo atual para não perdê-la na fusão
            const completeCv: CVData = {
                ...enrichedCV,
                style: cvData.style
            }
            onApplyEnrichment(completeCv)
            onClose()
        }
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        // Prevent closing the modal when process is active
        if (isPending) return
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div className="modal-backdrop no-print" onClick={handleBackdropClick}>
            <div className="enrichment-modal-container">
                <div className="enrichment-modal-header">
                    <h3 className="enrichment-modal-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                        Otimizador de Currículo IA
                    </h3>
                    {!isPending && (
                        <button type="button" className="enrichment-modal-close-btn" onClick={onClose}>
                            &times;
                        </button>
                    )}
                </div>

                <div className="enrichment-modal-body">
                    {!isPending && !isSuccess && !isError ? (
                        <>
                            <p className="enrichment-description">
                                Insira o ID numérico da vaga do LinkedIn ou o link da vaga. O assistente de inteligência artificial analisará os requisitos da vaga e adaptará o texto das suas experiências profissionais de maneira inteligente.
                            </p>
                            <div className="form-group">
                                <label htmlFor="linkedin-job-id">ID ou Link da Vaga no LinkedIn</label>
                                <input
                                    id="linkedin-job-id"
                                    type="text"
                                    placeholder="Ex: 3829017238 ou https://linkedin.com/jobs/view/..."
                                    value={linkedinJobId}
                                    onChange={(e) => setLinkedinJobId(e.target.value)}
                                    autoFocus
                                />
                                {validationError && (
                                    <span style={{ color: "#ef4444", fontSize: "0.75rem", fontWeight: 500, marginTop: "2px" }}>
                                        {validationError}
                                    </span>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="enrichment-progress-wrapper">
                                <div className="enrichment-progress-track">
                                    <div
                                        className="enrichment-progress-bar"
                                        style={{ width: `${progress}%`, backgroundColor: isError ? "#ef4444" : undefined }}
                                    />
                                </div>
                                <div className="enrichment-status-label">
                                    {isPending && !isSuccess && !isError && (
                                        <svg className="enrichment-spinner-small" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="2" x2="12" y2="6"></line>
                                            <line x1="12" y1="18" x2="12" y2="22"></line>
                                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                            <line x1="2" y1="12" x2="6" y2="12"></line>
                                            <line x1="18" y1="12" x2="22" y2="12"></line>
                                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                                        </svg>
                                    )}
                                    {statusLabel}
                                </div>
                            </div>

                            {isSuccess && (
                                <div className="enrichment-success-card">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    <div>
                                        <strong>Currículo pronto!</strong> A inteligência artificial terminou de adaptar as experiências e habilidades para a vaga solicitada. Clique abaixo para aplicar no editor.
                                    </div>
                                </div>
                            )}

                            {isError && (
                                <div className="enrichment-error-card">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <div>
                                        <strong>Falha na adaptação:</strong> {errorMessage}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="enrichment-modal-footer">
                    {!isPending && !isSuccess && !isError && (
                        <>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancelar
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleStart}>
                                Adaptar com IA
                            </button>
                        </>
                    )}

                    {isSuccess && (
                        <>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Descartar
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleApply}>
                                Aplicar Currículo Adaptado
                            </button>
                        </>
                    )}

                    {isError && (
                        <>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Fechar
                            </button>
                            <button type="button" className="btn btn-primary" onClick={reset}>
                                Tentar Novamente
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
