import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CVEditor from './components/CVEditor';
import CVPreview from './components/CVPreview';
import { sampleData } from './constants/sampleData';
import Modal from './components/Modal';

const emptyData = {
  personal: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: ""
  },
  objective: "",
  experience: [],
  education: [],
  certificates: [],
  skills: [],
  languages: [],
  style: {
    theme: "modern",
    fontFamily: "inter",
    accentColor: "#7c3aed",
    spacing: "normal"
  }
};

export default function App() {
  const [cvData, setCvData] = useState(() => {
    const saved = localStorage.getItem('cv_builder_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar dados do LocalStorage", e);
      }
    }
    return sampleData; // Carrega dados de exemplo por padrão para encantar o usuário na primeira visita
  });

  // Salvar no localStorage sempre que os dados mudarem
  useEffect(() => {
    localStorage.setItem('cv_builder_data', JSON.stringify(cvData));
  }, [cvData]);

  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth > 320 && newWidth < 700) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // MODAIS CUSTOMIZADOS
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "confirm", // 'confirm' | 'alert'
    onConfirm: null
  });

  const showAlert = (title, message) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "alert",
      onConfirm: null
    });
  };

  const showConfirm = (title, message, onConfirmAction) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "confirm",
      onConfirm: () => {
        onConfirmAction();
        closeModal();
      }
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // DADOS PESSOAIS
  const handleChangePersonal = (field, value) => {
    setCvData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value
      }
    }));
  };

  // OBJETIVO
  const handleChangeObjective = (value) => {
    setCvData(prev => ({
      ...prev,
      objective: value
    }));
  };

  // ESTILO
  const handleChangeStyle = (field, value) => {
    setCvData(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [field]: value
      }
    }));
  };

  // EXPERIÊNCIA
  const handleAddExperience = () => {
    const newItem = {
      id: `exp-${Date.now()}`,
      company: "",
      role: "",
      location: "",
      startDate: "",
      endDate: "",
      description: ""
    };
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, newItem]
    }));
  };

  const handleUpdateExperience = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveExperience = (id) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter(item => item.id !== id)
    }));
  };

  const handleMoveExperience = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= cvData.experience.length) return;
    
    setCvData(prev => {
      const list = [...prev.experience];
      const temp = list[index];
      list[index] = list[nextIndex];
      list[nextIndex] = temp;
      return { ...prev, experience: list };
    });
  };

  // FORMAÇÃO
  const handleAddEducation = () => {
    const newItem = {
      id: `edu-${Date.now()}`,
      institution: "",
      degree: "",
      startDate: "",
      endDate: "",
      description: ""
    };
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, newItem]
    }));
  };

  const handleUpdateEducation = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveEducation = (id) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter(item => item.id !== id)
    }));
  };

  const handleMoveEducation = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= cvData.education.length) return;

    setCvData(prev => {
      const list = [...prev.education];
      const temp = list[index];
      list[index] = list[nextIndex];
      list[nextIndex] = temp;
      return { ...prev, education: list };
    });
  };

  // CERTIFICADOS
  const handleAddCertificate = () => {
    const newItem = {
      id: `cert-${Date.now()}`,
      name: "",
      organization: "",
      date: ""
    };
    setCvData(prev => ({
      ...prev,
      certificates: [...prev.certificates, newItem]
    }));
  };

  const handleUpdateCertificate = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      certificates: prev.certificates.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveCertificate = (id) => {
    setCvData(prev => ({
      ...prev,
      certificates: prev.certificates.filter(item => item.id !== id)
    }));
  };

  const handleMoveCertificate = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= cvData.certificates.length) return;

    setCvData(prev => {
      const list = [...prev.certificates];
      const temp = list[index];
      list[index] = list[nextIndex];
      list[nextIndex] = temp;
      return { ...prev, certificates: list };
    });
  };

  // COMPETÊNCIAS (SKILLS)
  const handleAddSkill = (skill) => {
    if (cvData.skills.includes(skill)) return;
    setCvData(prev => ({
      ...prev,
      skills: [...prev.skills, skill]
    }));
  };

  const handleRemoveSkill = (skill) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // IDIOMAS
  const handleAddLanguage = () => {
    const newItem = {
      id: `lang-${Date.now()}`,
      name: "",
      level: "Intermediário"
    };
    setCvData(prev => ({
      ...prev,
      languages: [...prev.languages, newItem]
    }));
  };

  const handleUpdateLanguage = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      languages: prev.languages.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveLanguage = (id) => {
    setCvData(prev => ({
      ...prev,
      languages: prev.languages.filter(item => item.id !== id)
    }));
  };

  // OPERAÇÕES GLOBAIS (NAVBAR)
  const handleLoadSample = () => {
    showConfirm(
      "Carregar Dados de Exemplo", 
      "Isso irá substituir todas as informações atuais pelos dados profissionais de exemplo. Deseja continuar?", 
      () => setCvData(sampleData)
    );
  };

  const handleClearAll = () => {
    showConfirm(
      "Limpar Todos os Campos", 
      "Deseja realmente apagar todas as informações do seu currículo? Essa ação não poderá ser desfeita.", 
      () => setCvData(emptyData)
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

  const handleImportJson = (importedData) => {
    // Validação básica de campos necessários
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
          onChangePersonal={handleChangePersonal}
          onChangeObjective={handleChangeObjective}
          onChangeStyle={handleChangeStyle}
          
          onAddExperience={handleAddExperience}
          onUpdateExperience={handleUpdateExperience}
          onRemoveExperience={handleRemoveExperience}
          onMoveExperience={handleMoveExperience}
          
          onAddEducation={handleAddEducation}
          onUpdateEducation={handleUpdateEducation}
          onRemoveEducation={handleRemoveEducation}
          onMoveEducation={handleMoveEducation}
          
          onAddCertificate={handleAddCertificate}
          onUpdateCertificate={handleUpdateCertificate}
          onRemoveCertificate={handleRemoveCertificate}
          onMoveCertificate={handleMoveCertificate}
          
          onAddSkill={handleAddSkill}
          onRemoveSkill={handleRemoveSkill}
          
          onAddLanguage={handleAddLanguage}
          onUpdateLanguage={handleUpdateLanguage}
          onRemoveLanguage={handleRemoveLanguage}
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
          onConfirm={modalConfig.onConfirm}
        />
      )}
    </div>
  );
}
