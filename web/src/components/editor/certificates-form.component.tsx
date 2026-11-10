import { CertificateItem, ItemCuration } from '../../types/cv.model';

interface CertificatesFormProps {
  certificatesList: CertificateItem[];
  onAddCertificate: () => void;
  onUpdateCertificate: (id: string, field: keyof CertificateItem, value: string) => void;
  onRemoveCertificate: (id: string) => void;
  onMoveCertificate: (index: number, direction: number) => void;
  curationMap?: Record<string, ItemCuration>;
  onToggleInclusion?: (id: string) => void;
}

export default function CertificatesForm({
  certificatesList,
  onAddCertificate,
  onUpdateCertificate,
  onRemoveCertificate,
  onMoveCertificate,
  curationMap,
  onToggleInclusion
}: CertificatesFormProps) {
  return (
    <div className="section-list">
      {certificatesList.map((cert, index) => {
        const itemCur = curationMap ? curationMap[cert.id] : undefined;
        const isIncluded = itemCur ? itemCur.included : true;

        return (
          <div key={cert.id} className={`item-card ${curationMap && !isIncluded ? 'is-excluded' : ''}`}>
            {curationMap && (
              <div className="item-curation-bar">
                <button
                  type="button"
                  className={`item-toggle-btn ${isIncluded ? 'included' : 'excluded'}`}
                  onClick={() => onToggleInclusion?.(cert.id)}
                  title="Ativar ou ocultar esta certificação no currículo A4"
                >
                  {isIncluded ? '✓ No Currículo A4' : '✕ Oculto no A4'}
                </button>
                {itemCur?.relevanceScore !== undefined && (
                  <span className="item-relevance-tag">
                    Afinidade: {itemCur.relevanceScore}%
                  </span>
                )}
              </div>
            )}

            <div className="item-card-header">
              <span className="item-card-title">{cert.name || 'Certificado sem nome'}</span>
              <div className="item-card-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onMoveCertificate(index, -1)}
                  disabled={index === 0}
                  title="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onMoveCertificate(index, 1)}
                  disabled={index === certificatesList.length - 1}
                  title="Mover para baixo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="icon-btn btn-danger-outline-icon"
                  onClick={() => onRemoveCertificate(cert.id)}
                  title="Excluir"
                >
                  🗑
                </button>
              </div>
            </div>

            <div className="item-card-body">
              <div className="form-group">
                <label>Nome do Certificado</label>
                <input
                  type="text"
                  placeholder="Ex: React Professional Masterclass"
                  value={cert.name}
                  onChange={(e) => onUpdateCertificate(cert.id, 'name', e.target.value)}
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Organização Emissora</label>
                  <input
                    type="text"
                    placeholder="Ex: Meta, Alura, Coursera"
                    value={cert.organization}
                    onChange={(e) => onUpdateCertificate(cert.id, 'organization', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Data / Ano</label>
                  <input
                    type="text"
                    placeholder="Ex: 2023 ou Nov/23"
                    value={cert.date}
                    onChange={(e) => onUpdateCertificate(cert.id, 'date', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      <button type="button" className="btn btn-add" onClick={onAddCertificate}>
        + Adicionar Certificado
      </button>
    </div>
  );
}
