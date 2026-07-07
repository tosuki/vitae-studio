import { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  icon?: ReactNode;
}

export default function FormSection({ title, isOpen, onToggle, children, icon }: FormSectionProps) {
  return (
    <div className={`form-section ${isOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="form-section-header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="form-section-title-wrapper">
          {icon && <span className="form-section-icon">{icon}</span>}
          <span className="form-section-title">{title}</span>
        </div>
        <span className={`form-section-arrow ${isOpen ? 'rotated' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="form-section-content">
          {children}
        </div>
      )}
    </div>
  );
}
