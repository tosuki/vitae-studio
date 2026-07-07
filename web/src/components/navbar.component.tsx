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
}

export default function Navbar({ onLoadSample, onClear, onExportJson, onImportJson, onPrint, onAlert, onOpenEnrichment }: NavbarProps) {
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
            className="btn btn-secondary"
            onClick={onOpenEnrichment}
            title="Enriquecer"
          >
            Enriquecer
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
