import { LanguageItem } from '../../types/cv';

interface LanguagesFormProps {
  languagesList: LanguageItem[];
  onAddLanguage: () => void;
  onUpdateLanguage: (id: string, field: keyof LanguageItem, value: string) => void;
  onRemoveLanguage: (id: string) => void;
}

export default function LanguagesForm({
  languagesList,
  onAddLanguage,
  onUpdateLanguage,
  onRemoveLanguage
}: LanguagesFormProps) {
  return (
    <div className="section-list">
      {languagesList.map((lang) => (
        <div key={lang.id} className="language-item-row">
          <input
            type="text"
            placeholder="Ex: Inglês"
            value={lang.name}
            onChange={(e) => onUpdateLanguage(lang.id, 'name', e.target.value)}
          />
          <select
            value={lang.level}
            onChange={(e) => onUpdateLanguage(lang.id, 'level', e.target.value)}
          >
            <option value="Nativo">Nativo</option>
            <option value="Fluente">Fluente</option>
            <option value="Avançado">Avançado</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Básico">Básico</option>
          </select>
          <button
            type="button"
            className="icon-btn btn-danger-outline-icon"
            onClick={() => onRemoveLanguage(lang.id)}
            title="Excluir"
          >
            🗑
          </button>
        </div>
      ))}

      <button type="button" className="btn btn-add" onClick={onAddLanguage}>
        + Adicionar Idioma
      </button>
    </div>
  );
}
