import { CertificateItem } from '../../types/cv';

interface CertificatesPreviewProps {
  certificatesList: CertificateItem[];
}

export default function CertificatesPreview({ certificatesList }: CertificatesPreviewProps) {
  return (
    <section className="cv-section">
      <h2 className="cv-section-title">Certificados</h2>
      <div className="cv-section-divider"></div>
      <div className="cv-section-content certificates-grid">
        {certificatesList.map((cert) => (
          <div key={cert.id} className="cv-certificate-item">
            <div className="cv-cert-main">
              <span className="cv-cert-name">{cert.name}</span>
              <span className="cv-cert-org"> — {cert.organization}</span>
            </div>
            {cert.date && <span className="cv-cert-date">{cert.date}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
