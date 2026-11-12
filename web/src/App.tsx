import { useState, useEffect } from 'react';
import Navbar from './components/navbar.component';
import CVEditor from './components/editor/cv-editor.component';
import CVPreview from './components/preview/cv-preview.component';
import Modal from './components/modal.component';
import EnrichmentModal from './components/enrichment-modal.component';
import ResumeUploadModal from './components/resume-upload-modal.component';
import CurateJobModal from './components/curate-job-modal.component';
import AtsModal from './components/ats-modal.component';
import SettingsModal from './components/settings-modal.component';
import { useCVState } from './hooks/cv-state.hook';
import { useSidebarResize } from './hooks/sidebar-resize.hook';
import { useModalState } from './hooks/modal-state.hook';
import { EnrichmentProvider } from './hooks/enrichment.hook';
import { useSettings } from './hooks/settings.hook';
import { CVData, JobTarget, TargetedCuration } from './types/cv.model';

const ONBOARDING_DISMISSED_KEY = 'vitae_studio_onboarding_dismissed';

function AppContent() {
  const {
    cvData,
    masterProfile,
    savedJobs,
    activeMode,
    activeJobId,
    activeJob,
    selectMasterMode,
    selectJobMode,
    addCuratedJob,
    removeCuratedJob,
    toggleItemInclusion,
    toggleTailoredText,
    setCvData,
    loadSample,
    resetToEmpty,
    ...cvActions
  } = useCVState();

  const { sidebarWidth, isResizing, startResizing } = useSidebarResize(420);
  const { modalConfig, showAlert, showConfirm, closeModal } = useModalState();
  const [isEnrichmentModalOpen, setIsEnrichmentModalOpen] = useState(false);
  const [isResumeUploadModalOpen, setIsResumeUploadModalOpen] = useState(false);
  const [isCurateJobModalOpen, setIsCurateJobModalOpen] = useState(false);
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
      "Isso irá substituir todas as informações do Perfil Mestre pelos dados de exemplo. Deseja continuar?",
      loadSample
    );
  };

  const handleClearAll = () => {
    showConfirm(
      "Limpar Todos os Campos",
      "Deseja realmente apagar todas as informações do seu Perfil Mestre? Essa ação não poderá ser desfeita.",
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
      setCvData({
        ...importedData,
        projects: Array.isArray(importedData.projects) ? importedData.projects : []
      });
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

  const handleApplyLinkedinEnrichment = (
    enrichedCv: CVData,
    jobInfo?: { jobId: string; roleTitle?: string; company?: string }
  ) => {
    const roleTitle = enrichedCv.personal.title?.trim() || (jobInfo?.jobId ? `Vaga LinkedIn #${jobInfo.jobId}` : "Vaga LinkedIn");
    const newJob: JobTarget = {
      id: `job-linkedin-${Date.now()}`,
      roleTitle,
      company: jobInfo?.company || "LinkedIn",
      jobDescription: `Currículo adaptado via LinkedIn (ID: ${jobInfo?.jobId || 'N/A'})`,
      createdAt: Date.now()
    };

    const newCuration: TargetedCuration = {
      jobTitle: roleTitle,
      company: jobInfo?.company || "LinkedIn",
      matchScore: 92,
      matchedKeywords: (enrichedCv.skills || []).slice(0, 8),
      missingKeywords: [],
      tailoredObjective: enrichedCv.objective,
      experience: Object.fromEntries(
        (enrichedCv.experience || []).map(e => [e.id, { included: true, tailoredDescription: e.description, useTailoredText: true }])
      ),
      projects: Object.fromEntries(
        (enrichedCv.projects || []).map(p => [p.id, { included: true, tailoredDescription: p.description, useTailoredText: true }])
      ),
      education: Object.fromEntries(
        (enrichedCv.education || []).map(ed => [ed.id, { included: true }])
      ),
      certificates: Object.fromEntries(
        (enrichedCv.certificates || []).map(c => [c.id, { included: true }])
      ),
      selectedSkills: enrichedCv.skills || []
    };

    addCuratedJob(newJob, newCuration, enrichedCv);
    showAlert(
      "Nova Bagagem Criada com Sucesso!",
      `A nova bagagem "${roleTitle}" foi gerada a partir da vaga do LinkedIn e selecionada para edição. Sua Bagagem Mestra permaneceu 100% protegida e intacta.`
    );
  };

  return (
    <div className="app-container">
      <Navbar
        onLoadSample={handleLoadSample}
        onClear={handleClearAll}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onOpenResumeUpload={() => setIsResumeUploadModalOpen(true)}
        onPrint={handlePrint}
        onAlert={showAlert}
        onOpenEnrichment={() => setIsEnrichmentModalOpen(true)}
        onOpenAtsValidation={() => setIsAtsModalOpen(true)}
        onOpenSettings={handleOpenSettingsManual}
        isAIConfigured={isConfigured}
        activeMode={activeMode}
        savedJobs={savedJobs}
        activeJobId={activeJobId}
        onSelectMaster={selectMasterMode}
        onSelectJob={selectJobMode}
        onRemoveJob={removeCuratedJob}
        onOpenCurateJob={() => setIsCurateJobModalOpen(true)}
      />

      <div className={`dashboard-workspace ${isResizing ? 'is-resizing' : ''}`}>
        <CVEditor
          data={activeMode === 'curated' && activeJob?.cv ? activeJob.cv : cvData}
          style={{ width: `${sidebarWidth}px` }}
          activeMode={activeMode}
          activeJob={activeJob}
          onToggleItemInclusion={toggleItemInclusion}
          onToggleTailoredText={toggleTailoredText}
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

      {/* CURADORIA DE VAGA (1 PÁGINA A4) */}
      <CurateJobModal
        isOpen={isCurateJobModalOpen}
        onClose={() => setIsCurateJobModalOpen(false)}
        cvData={masterProfile}
        onApplyCuration={addCuratedJob}
        isAIConfigured={isConfigured}
        onOpenSettings={handleOpenSettingsManual}
      />

      {/* OTIMIZAÇÃO LINKEDIN */}
      <EnrichmentModal
        isOpen={isEnrichmentModalOpen}
        onClose={() => setIsEnrichmentModalOpen(false)}
        cvData={masterProfile}
        onApplyEnrichment={handleApplyLinkedinEnrichment}
        isAIConfigured={isConfigured}
        onOpenSettings={handleOpenSettingsManual}
      />

      {/* UPLOAD & PARSING DE CURRÍCULO (PDF/TXT) */}
      <ResumeUploadModal
        isOpen={isResumeUploadModalOpen}
        onClose={() => setIsResumeUploadModalOpen(false)}
        cvData={masterProfile}
        onApplyExtractedCV={setCvData}
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
