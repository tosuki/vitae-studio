import { StyleConfig } from '../../types/cv';

interface StyleFormProps {
  styleData: StyleConfig;
  onChangeStyle: (field: keyof StyleConfig, value: string) => void;
}

export default function StyleForm({ styleData, onChangeStyle }: StyleFormProps) {
  const colors = [
    { name: 'Roxo (Padrão)', value: '#7c3aed' },
    { name: 'Azul Real', value: '#1d4ed8' },
    { name: 'Verde Esmeralda', value: '#059669' },
    { name: 'Crimson', value: '#dc2626' },
    { name: 'Cinza Escuro', value: '#374151' },
    { name: 'Indigo', value: '#4f46e5' }
  ];

  return (
    <>
      <div className="form-group-row">
        <div className="form-group">
          <label htmlFor="style-theme">Layout / Tema</label>
          <select
            id="style-theme"
            value={styleData.theme}
            onChange={(e) => onChangeStyle('theme', e.target.value)}
          >
            <option value="modern">Moderno (Centralizado)</option>
            <option value="classic">Clássico (Tradicional)</option>
            <option value="minimalist">Minimalista (Compacto)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="style-font">Fonte</label>
          <select
            id="style-font"
            value={styleData.fontFamily}
            onChange={(e) => onChangeStyle('fontFamily', e.target.value)}
          >
            <option value="inter">Inter (Sem-Serif)</option>
            <option value="lora">Lora (Serif Clássica)</option>
            <option value="roboto">Roboto (Corporativa)</option>
          </select>
        </div>
      </div>

      <div className="form-group-row">
        <div className="form-group">
          <label htmlFor="style-spacing">Espaçamento (Densidade)</label>
          <select
            id="style-spacing"
            value={styleData.spacing}
            onChange={(e) => onChangeStyle('spacing', e.target.value)}
          >
            <option value="compact">Compacto</option>
            <option value="normal">Normal</option>
            <option value="relaxed">Espaçoso</option>
          </select>
        </div>

        <div className="form-group">
          <label>Cor de Destaque</label>
          <div className="color-picker-grid">
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`color-dot ${styleData.accentColor === c.value ? 'active' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => onChangeStyle('accentColor', c.value)}
                title={c.name}
              />
            ))}
            <input
              type="color"
              className="color-custom-picker"
              value={styleData.accentColor}
              onChange={(e) => onChangeStyle('accentColor', e.target.value)}
              title="Cor personalizada"
            />
          </div>
        </div>
      </div>
    </>
  );
}
