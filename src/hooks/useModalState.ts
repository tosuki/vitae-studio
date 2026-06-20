import { useState } from 'react';

interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'confirm' | 'alert';
  onConfirm: (() => void) | null;
}

export function useModalState() {
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "confirm",
    onConfirm: null
  });

  const showAlert = (title: string, message: string) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "alert",
      onConfirm: null
    });
  };

  const showConfirm = (title: string, message: string, onConfirmAction: () => void) => {
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

  return {
    modalConfig,
    showAlert,
    showConfirm,
    closeModal
  };
}
