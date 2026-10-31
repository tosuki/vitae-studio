import { useRef, ChangeEvent } from 'react';
import { CVData } from '../types/cv.model';
import './navbar.component.css';

interface NavbarProps {
  onLoadSample: () => void;
  onClear: () => void;
  onExportJson: () => void;
  onImportJson: (data: CVData) => void;
  onPrint: () => void;
  onAlert: (title: string, message: string) => void;
  onOpenEnrichment: () => void;
  onOpenAtsValidation: () => void;
  onOpenSettings: () => void;
  isAIConfigured?: boolean;
}

export default function Navbar({
  onLoadSample,
  onClear,
  onExportJson,
  onImportJson,
  onPrint,
  onAlert,
  onOpenEnrichment,
  onOpenAtsValidation,
  onOpenSettings,
  isAIConfigured = false
}: NavbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const data = JSON.parse(result) as CVData;
          onImportJson(data);
        }
        // Reset file input value so same file can be selected again
        event.target.value = '';
      } catch {
        onAlert(
          "Erro na Importação",
          "Não foi possível ler o arquivo JSON. Certifique-se de que é um arquivo válido gerado por esta ferramenta."
        );
      }
    };
    reader.readAsText(file);
  };

  return (
    <nav className="navbar no-print">
      <div className="navbar-brand">
        <svg className="navbar-logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span className="navbar-title">Vitae <span className="badge">Studio</span></span>
      </div>

      <div className="navbar-actions">
        <div className="action-group">
          <button
            type="button"
            className="btn btn-ats"
            onClick={onOpenAtsValidation}
            title="Validar compatibilidade do currículo com sistemas ATS"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
            Validar ATS
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenEnrichment}
            title="Otimizar currículo para vaga do LinkedIn com IA"
          >
            Enriquecer
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-ai-settings"
            onClick={onOpenSettings}
            title={isAIConfigured ? "Provedor de IA configurado — clique para alterar" : "Configurar provedor de IA (Gemini, OpenAI ou 9router)"}
          >
            <span className={`ai-status-dot ${isAIConfigured ? "configured" : "pending"}`} />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Configurar IA
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onLoadSample}
            title="Preencher com dados fictícios profissionais"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            Carregar Exemplo
          </button>

          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={onClear}
            title="Limpar todos os campos do currículo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Limpar
          </button>
        </div>

        <div className="action-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            title="Importar dados de um arquivo JSON"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Importar JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onExportJson}
            title="Exportar dados atuais do currículo como arquivo JSON"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exportar JSON
          </button>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onPrint}
          title="Imprimir ou Salvar currículo como PDF"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Salvar / Imprimir PDF
        </button>
      </div>
    </nav>
  );
}
