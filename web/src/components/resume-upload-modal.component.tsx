import { useState, useEffect, useRef, ChangeEvent, DragEvent } from "react";
import { useResumeUpload } from "../hooks/resume-upload.hook";
import { CVData } from "../types/cv.model";
import "./resume-upload-modal.component.css";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface ResumeUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    cvData: CVData;
    onApplyExtractedCV: (hydratedCv: CVData) => void;
    isAIConfigured?: boolean;
    onOpenSettings?: () => void;
}

export default function ResumeUploadModal({
    isOpen,
    onClose,
    cvData,
    onApplyExtractedCV,
    isAIConfigured = true,
    onOpenSettings
}: ResumeUploadModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        startResumeUpload,
        reset,
        progress,
        statusLabel,
        isPending,
        isSuccess,
        isError,
        errorMessage,
        extractedCV
    } = useResumeUpload();

    useEffect(() => {
        if (!isOpen) {
            setSelectedFile(null);
            setIsDragging(false);
            setValidationError(null);
            reset();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validateAndSelectFile = (file: File) => {
        setValidationError(null);
        const lowerName = file.name.toLowerCase();
        const isPdf = lowerName.endsWith(".pdf") || file.type === "application/pdf";
        const isTxt = lowerName.endsWith(".txt") || file.type === "text/plain";

        if (!isPdf && !isTxt) {
            setValidationError("Formato inválido. Selecione apenas arquivos .pdf ou .txt.");
            setSelectedFile(null);
            return;
        }

        if (file.size === 0) {
            setValidationError("O arquivo selecionado está vazio.");
            setSelectedFile(null);
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setValidationError("O arquivo excede o tamanho máximo permitido de 5MB.");
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    };

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndSelectFile(file);
        }
        e.target.value = "";
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isPending) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (isPending) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            validateAndSelectFile(file);
        }
    };

    const handleStartExtraction = () => {
        setValidationError(null);
        if (!isAIConfigured) {
            setValidationError("Configure um provedor de IA (Gemini, OpenAI ou 9router) antes de extrair o currículo.");
            return;
        }
        if (!selectedFile) {
            setValidationError("Selecione ou arraste um arquivo .pdf ou .txt para continuar.");
            return;
        }
        startResumeUpload(selectedFile);
    };

    const handleHydrateForm = () => {
        if (!extractedCV) return;
        const hydratedCv: CVData = {
            ...extractedCV,
            style: cvData.style
        };
        onApplyExtractedCV(hydratedCv);
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (isPending) return;
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <div className="modal-backdrop no-print" onClick={handleBackdropClick}>
            <div className="resume-upload-modal-container">
                <div className="resume-upload-modal-header">
                    <h3 className="resume-upload-modal-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <path d="M12 18v-6"></path>
                            <path d="m9 15 3-3 3 3"></path>
                        </svg>
                        Importar Currículo (PDF ou TXT)
                    </h3>
                    {!isPending && (
                        <button type="button" className="resume-upload-close-btn" onClick={onClose}>
                            &times;
                        </button>
                    )}
                </div>

                <div className="resume-upload-modal-body">
                    {!isPending && !isSuccess && !isError ? (
                        <>
                            {!isAIConfigured && (
                                <div className="resume-upload-alert-card warning">
                                    <div>
                                        <strong>IA ainda não configurada.</strong> Configure sua chave de API para usar a extração inteligente.
                                    </div>
                                    {onOpenSettings && (
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            style={{ flexShrink: 0, padding: "6px 10px", fontSize: "0.78rem" }}
                                            onClick={() => {
                                                onClose();
                                                onOpenSettings();
                                            }}
                                        >
                                            Configurar IA
                                        </button>
                                    )}
                                </div>
                            )}

                            <p className="resume-upload-description">
                                Faça o upload do seu currículo atual em <strong>PDF (baseado em texto)</strong> ou <strong>TXT</strong>. A Inteligência Artificial extrairá seus dados pessoais, experiências, formação e habilidades para pré-preencher o editor automaticamente.
                            </p>

                            <div
                                className={`resume-dropzone ${isDragging ? "is-dragging" : ""} ${selectedFile ? "has-file" : ""}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.txt,application/pdf,text/plain"
                                    onChange={handleFileInputChange}
                                    style={{ display: "none" }}
                                />

                                {!selectedFile ? (
                                    <div className="resume-dropzone-empty">
                                        <div className="resume-dropzone-icon">
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="17 8 12 3 7 8"></polyline>
                                                <line x1="12" y1="3" x2="12" y2="15"></line>
                                            </svg>
                                        </div>
                                        <span className="resume-dropzone-main-text">
                                            Arraste seu currículo aqui ou <strong>clique para selecionar</strong>
                                        </span>
                                        <span className="resume-dropzone-sub-text">
                                            Suporta arquivos .PDF (selecionável) e .TXT de até 5MB
                                        </span>
                                    </div>
                                ) : (
                                    <div className="resume-dropzone-selected" onClick={(e) => e.stopPropagation()}>
                                        <div className="resume-file-badge">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                            </svg>
                                            <div className="resume-file-info">
                                                <span className="resume-file-name">{selectedFile.name}</span>
                                                <span className="resume-file-meta">
                                                    {selectedFile.name.toLowerCase().endsWith(".pdf") ? "Documento PDF" : "Arquivo de Texto"} • {formatFileSize(selectedFile.size)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-secondary resume-file-change-btn"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Trocar arquivo
                                        </button>
                                    </div>
                                )}
                            </div>

                            {validationError && (
                                <div className="resume-upload-validation-error">
                                    {validationError}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="resume-upload-progress-wrapper">
                                <div className="resume-upload-progress-track">
                                    <div
                                        className="resume-upload-progress-bar"
                                        style={{
                                            width: `${progress}%`,
                                            backgroundColor: isError ? "#ef4444" : undefined
                                        }}
                                    />
                                </div>
                                <div className="resume-upload-status-label">
                                    {isPending && !isSuccess && !isError && (
                                        <svg className="resume-upload-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

                            {isSuccess && extractedCV && (
                                <div className="resume-upload-success-box">
                                    <div className="resume-upload-success-header">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <div>
                                            <strong>Extração concluída!</strong> Confira o resumo das entidades identificadas antes de preencher o formulário:
                                        </div>
                                    </div>
                                    <div className="resume-extracted-summary-grid">
                                        <div className="summary-pill">
                                            <span className="summary-pill-label">Profissional</span>
                                            <span className="summary-pill-value">{extractedCV.personal.fullName || "Não identificado"}</span>
                                        </div>
                                        <div className="summary-pill">
                                            <span className="summary-pill-label">Experiências</span>
                                            <span className="summary-pill-value">{extractedCV.experience.length} registro(s)</span>
                                        </div>
                                        <div className="summary-pill">
                                            <span className="summary-pill-label">Formações</span>
                                            <span className="summary-pill-value">{extractedCV.education.length} registro(s)</span>
                                        </div>
                                        <div className="summary-pill">
                                            <span className="summary-pill-label">Competências & Idiomas</span>
                                            <span className="summary-pill-value">
                                                {extractedCV.skills.length} skills • {extractedCV.languages.length} idioma(s)
                                            </span>
                                        </div>
                                    </div>
                                    <span className="resume-upload-review-note">
                                        Seus dados serão preenchidos no editor lateral para que você possa revisar e ajustar qualquer campo livremente.
                                    </span>
                                </div>
                            )}

                            {isError && (
                                <div className="resume-upload-alert-card error">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <div>
                                        <strong>Falha na importação:</strong> {errorMessage}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="resume-upload-modal-footer">
                    {!isPending && !isSuccess && !isError && (
                        <>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleStartExtraction}
                                disabled={!selectedFile}
                            >
                                Extrair e Preencher com IA
                            </button>
                        </>
                    )}

                    {isSuccess && (
                        <>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Descartar
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleHydrateForm}>
                                Preencher Formulário
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
    );
}
