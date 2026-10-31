import { useState, useEffect } from 'react';
import Navbar from './components/navbar.component';
import CVEditor from './components/editor/cv-editor.component';
import CVPreview from './components/preview/cv-preview.component';
import Modal from './components/modal.component';
import EnrichmentModal from './components/enrichment-modal.component';
import AtsModal from './components/ats-modal.component';
import SettingsModal from './components/settings-modal.component';
import { useCVState } from './hooks/cv-state.hook';
import { useSidebarResize } from './hooks/sidebar-resize.hook';
import { useModalState } from './hooks/modal-state.hook';
import { EnrichmentProvider } from './hooks/enrichment.hook';
import { useSettings } from './hooks/settings.hook';
import { CVData } from './types/cv.model';

const ONBOARDING_DISMISSED_KEY = 'vitae_studio_onboarding_dismissed';

function AppContent() {
  const {
    cvData,
    setCvData,
    loadSample,
    resetToEmpty,
    ...cvActions
  } = useCVState();

  const { sidebarWidth, isResizing, startResizing } = useSidebarResize(420);
  const { modalConfig, showAlert, showConfirm, closeModal } = useModalState();
  const [isEnrichmentModalOpen, setIsEnrichmentModalOpen] = useState(false);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isOnboardingMode, setIsOnboardingMode] = useState(false);

  const { isConfigured, isFetched, isError } = useSettings();

  useEffect(() => {
    if (isFetched && !isError && !isConfigured) {
      const dismissed = sessionStorage.getItem(ONBOARDING_DISMISSED_KEY);
      if (!dismissed) {
        setIsOnboardingMode(true);
        setIsSettingsModalOpen(true);
      }
    }
  }, [isFetched, isError, isConfigured]);

  const handleCloseSettings = () => {
    if (isOnboardingMode) {
      sessionStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
      setIsOnboardingMode(false);
    }
    setIsSettingsModalOpen(false);
  };

  const handleOpenSettingsManual = () => {
    setIsOnboardingMode(false);
    setIsSettingsModalOpen(true);
  };

  const handleApplyAtsTheme = () => {
    cvActions.onChangeStyle('theme', 'ats');
  };

  // OPERAÇÕES GLOBAIS (NAVBAR)
  const handleLoadSample = () => {
    showConfirm(
      "Carregar Dados de Exemplo",
      "Isso irá substituir todas as informações atuais pelos dados profissionais de exemplo. Deseja continuar?",
      loadSample
    );
  };

  const handleClearAll = () => {
    showConfirm(
      "Limpar Todos os Campos",
      "Deseja realmente apagar todas as informações do seu currículo? Essa ação não poderá ser desfeita.",
      resetToEmpty
    );
  };

  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(cvData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);

    const fileName = cvData.personal.fullName
      ? `curriculo_${cvData.personal.fullName.toLowerCase().replace(/\s+/g, '_')}.json`
      : 'curriculo_dados.json';

    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (importedData: CVData) => {
    if (importedData && importedData.personal && Array.isArray(importedData.experience)) {
      setCvData(importedData);
    } else {
      showAlert(
        "Estrutura Inválida",
        "O arquivo JSON importado não possui uma estrutura de currículo compatível com esta ferramenta."
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-container">
      <Navbar
        onLoadSample={handleLoadSample}
        onClear={handleClearAll}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onPrint={handlePrint}
        onAlert={showAlert}
        onOpenEnrichment={() => setIsEnrichmentModalOpen(true)}
        onOpenAtsValidation={() => setIsAtsModalOpen(true)}
        onOpenSettings={handleOpenSettingsManual}
        isAIConfigured={isConfigured}
      />

      <div className={`dashboard-workspace ${isResizing ? 'is-resizing' : ''}`}>
        <CVEditor
          data={cvData}
          style={{ width: `${sidebarWidth}px` }}
          {...cvActions}
        />

        <div className={`resize-handle no-print ${isResizing ? 'active' : ''}`} onMouseDown={startResizing} />

        <CVPreview data={cvData} />
      </div>

      {modalConfig.isOpen && (
        <Modal
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onClose={closeModal}
          onConfirm={modalConfig.onConfirm || undefined}
        />
      )}

      <EnrichmentModal
        isOpen={isEnrichmentModalOpen}
        onClose={() => setIsEnrichmentModalOpen(false)}
        cvData={cvData}
        onApplyEnrichment={setCvData}
        isAIConfigured={isConfigured}
        onOpenSettings={handleOpenSettingsManual}
      />

      <AtsModal
        isOpen={isAtsModalOpen}
        onClose={() => setIsAtsModalOpen(false)}
        cvData={cvData}
        onApplyAtsTheme={handleApplyAtsTheme}
        onPrint={handlePrint}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettings}
        isOnboarding={isOnboardingMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <EnrichmentProvider>
      <AppContent />
    </EnrichmentProvider>
  );
}
