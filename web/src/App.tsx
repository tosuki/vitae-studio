import Navbar from './components/Navbar';
import CVEditor from './components/editor/CVEditor';
import CVPreview from './components/preview/CVPreview';
import Modal from './components/Modal';
import { useCVState } from './hooks/useCVState';
import { useSidebarResize } from './hooks/useSidebarResize';
import { useModalState } from './hooks/useModalState';
import { CVData } from './types/cv';

export default function App() {
  const {
    cvData,
    setCvData,
    loadSample,
    resetToEmpty,
    ...cvActions
  } = useCVState();

  const { sidebarWidth, isResizing, startResizing } = useSidebarResize(420);
  const { modalConfig, showAlert, showConfirm, closeModal } = useModalState();

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
    </div>
  );
}
