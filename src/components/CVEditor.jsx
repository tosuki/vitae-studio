import { useState } from 'react';
import FormSection from './FormSection';

export default function CVEditor({
  data,
  style,
  onChangePersonal,
  onChangeObjective,
  onChangeStyle,
  onAddExperience,
  onUpdateExperience,
  onRemoveExperience,
  onMoveExperience,
  onAddEducation,
  onUpdateEducation,
  onRemoveEducation,
  onMoveEducation,
  onAddCertificate,
  onUpdateCertificate,
  onRemoveCertificate,
  onMoveCertificate,
  onAddSkill,
  onRemoveSkill,
  onAddLanguage,
  onUpdateLanguage,
  onRemoveLanguage
}) {
  const [openSections, setOpenSections] = useState({
    personal: true,
    objective: false,
    experience: false,
    education: false,
    certificates: false,
    skills: false,
    languages: false,
    style: true
  });

  const [newSkill, setNewSkill] = useState('');

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddSkillSubmit = (e) => {
    e.preventDefault();
    if (newSkill.trim()) {
      onAddSkill(newSkill.trim());
      setNewSkill('');
    }
  };

  const colors = [
    { name: 'Roxo (Padrão)', value: '#7c3aed' },
    { name: 'Azul Real', value: '#1d4ed8' },
    { name: 'Verde Esmeralda', value: '#059669' },
    { name: 'Crimson', value: '#dc2626' },
    { name: 'Cinza Escuro', value: '#374151' },
    { name: 'Indigo', value: '#4f46e5' }
  ];

  return (
    <aside className="cv-editor no-print" style={style}>
      {/* 1. ESTILO E CUSTOMIZAÇÃO */}
      <FormSection
        title="Visual & Estilo"
        isOpen={openSections.style}
        onToggle={() => toggleSection('style')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
        }
      >
        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="style-theme">Layout / Tema</label>
            <select
              id="style-theme"
              value={data.style.theme}
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
              value={data.style.fontFamily}
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
              value={data.style.spacing}
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
                  className={`color-dot ${data.style.accentColor === c.value ? 'active' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => onChangeStyle('accentColor', c.value)}
                  title={c.name}
                />
              ))}
              <input
                type="color"
                className="color-custom-picker"
                value={data.style.accentColor}
                onChange={(e) => onChangeStyle('accentColor', e.target.value)}
                title="Cor personalizada"
              />
            </div>
          </div>
        </div>
      </FormSection>

      {/* 2. DADOS PESSOAIS */}
      <FormSection
        title="Dados Pessoais"
        isOpen={openSections.personal}
        onToggle={() => toggleSection('personal')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        }
      >
        <div className="form-group">
          <label htmlFor="personal-name">Nome Completo</label>
          <input
            id="personal-name"
            type="text"
            placeholder="Ex: Gabriel Silva Santos"
            value={data.personal.fullName}
            onChange={(e) => onChangePersonal('fullName', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="personal-title">Cargo / Título Profissional</label>
          <input
            id="personal-title"
            type="text"
            placeholder="Ex: Desenvolvedor Frontend Senior"
            value={data.personal.title}
            onChange={(e) => onChangePersonal('title', e.target.value)}
          />
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="personal-email">E-mail</label>
            <input
              id="personal-email"
              type="email"
              placeholder="Ex: gabriel@email.com"
              value={data.personal.email}
              onChange={(e) => onChangePersonal('email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="personal-phone">Telefone</label>
            <input
              id="personal-phone"
              type="tel"
              placeholder="Ex: (11) 98765-4321"
              value={data.personal.phone}
              onChange={(e) => onChangePersonal('phone', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="personal-location">Localização (Cidade/Estado)</label>
          <input
            id="personal-location"
            type="text"
            placeholder="Ex: São Paulo, SP"
            value={data.personal.location}
            onChange={(e) => onChangePersonal('location', e.target.value)}
          />
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="personal-linkedin">LinkedIn (Link ou Usuário)</label>
            <input
              id="personal-linkedin"
              type="text"
              placeholder="Ex: linkedin.com/in/usuario"
              value={data.personal.linkedin}
              onChange={(e) => onChangePersonal('linkedin', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="personal-github">GitHub (Link ou Usuário)</label>
            <input
              id="personal-github"
              type="text"
              placeholder="Ex: github.com/usuario"
              value={data.personal.github}
              onChange={(e) => onChangePersonal('github', e.target.value)}
            />
          </div>
        </div>
      </FormSection>

      {/* 3. OBJETIVO / RESUMO */}
      <FormSection
        title="Objetivo / Resumo Profissional"
        isOpen={openSections.objective}
        onToggle={() => toggleSection('objective')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        }
      >
        <div className="form-group">
          <label htmlFor="objective-textarea">Sobre Você</label>
          <textarea
            id="objective-textarea"
            rows="5"
            placeholder="Escreva um breve resumo destacando suas principais competências, experiências e objetivos profissionais..."
            value={data.objective}
            onChange={(e) => onChangeObjective(e.target.value)}
          />
        </div>
      </FormSection>

      {/* 4. EXPERIÊNCIA PROFISSIONAL */}
      <FormSection
        title="Experiência Profissional"
        isOpen={openSections.experience}
        onToggle={() => toggleSection('experience')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        }
      >
        <div className="section-list">
          {data.experience.map((exp, index) => (
            <div key={exp.id} className="item-card">
              <div className="item-card-header">
                <span className="item-card-title">{exp.company || 'Empresa não informada'}</span>
                <div className="item-card-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onMoveExperience(index, -1)}
                    disabled={index === 0}
                    title="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onMoveExperience(index, 1)}
                    disabled={index === data.experience.length - 1}
                    title="Mover para baixo"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="icon-btn btn-danger-outline-icon"
                    onClick={() => onRemoveExperience(exp.id)}
                    title="Excluir"
                  >
                    🗑
                  </button>
                </div>
              </div>

              <div className="item-card-body">
                <div className="form-group-row">
                  <div className="form-group">
                    <label>Empresa</label>
                    <input
                      type="text"
                      placeholder="Ex: TechNova Solutions"
                      value={exp.company}
                      onChange={(e) => onUpdateExperience(exp.id, 'company', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cargo</label>
                    <input
                      type="text"
                      placeholder="Ex: Desenvolvedor Senior"
                      value={exp.role}
                      onChange={(e) => onUpdateExperience(exp.id, 'role', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Início (Mês/Ano)</label>
                    <input
                      type="text"
                      placeholder="Ex: 2023-03 ou Março/23"
                      value={exp.startDate}
                      onChange={(e) => onUpdateExperience(exp.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fim (Mês/Ano ou em branco para Presente)</label>
                    <input
                      type="text"
                      placeholder="Ex: Presente, 2024-12"
                      value={exp.endDate}
                      onChange={(e) => onUpdateExperience(exp.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Localização</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo, SP (Remoto)"
                    value={exp.location}
                    onChange={(e) => onUpdateExperience(exp.id, 'location', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Responsabilidades & Conquistas</label>
                  <textarea
                    rows="3"
                    placeholder="Foque em realizações e conquistas usando tópicos (ex: - Liderança técnica no desenvolvimento...)"
                    value={exp.description}
                    onChange={(e) => onUpdateExperience(exp.id, 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button type="button" className="btn btn-add" onClick={onAddExperience}>
            + Adicionar Experiência
          </button>
        </div>
      </FormSection>

      {/* 5. ACADÊMICO */}
      <FormSection
        title="Formação Acadêmica"
        isOpen={openSections.education}
        onToggle={() => toggleSection('education')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
          </svg>
        }
      >
        <div className="section-list">
          {data.education.map((edu, index) => (
            <div key={edu.id} className="item-card">
              <div className="item-card-header">
                <span className="item-card-title">{edu.institution || 'Instituição não informada'}</span>
                <div className="item-card-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onMoveEducation(index, -1)}
                    disabled={index === 0}
                    title="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onMoveEducation(index, 1)}
                    disabled={index === data.education.length - 1}
                    title="Mover para baixo"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="icon-btn btn-danger-outline-icon"
                    onClick={() => onRemoveEducation(edu.id)}
                    title="Excluir"
                  >
                    🗑
                  </button>
                </div>
              </div>

              <div className="item-card-body">
                <div className="form-group-row">
                  <div className="form-group">
                    <label>Instituição</label>
                    <input
                      type="text"
                      placeholder="Ex: USP"
                      value={edu.institution}
                      onChange={(e) => onUpdateEducation(edu.id, 'institution', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Título / Curso</label>
                    <input
                      type="text"
                      placeholder="Ex: Bacharelado em Ciência da Computação"
                      value={edu.degree}
                      onChange={(e) => onUpdateEducation(edu.id, 'degree', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Início (Ano)</label>
                    <input
                      type="text"
                      placeholder="Ex: 2017"
                      value={edu.startDate}
                      onChange={(e) => onUpdateEducation(edu.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Término (ou previsto)</label>
                    <input
                      type="text"
                      placeholder="Ex: 2021"
                      value={edu.endDate}
                      onChange={(e) => onUpdateEducation(edu.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descrição / Detalhes (Opcional)</label>
                  <textarea
                    rows="2"
                    placeholder="Destaques, notas, projetos acadêmicos importantes..."
                    value={edu.description}
                    onChange={(e) => onUpdateEducation(edu.id, 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-add" onClick={onAddEducation}>
            + Adicionar Formação
          </button>
        </div>
      </FormSection>

      {/* 6. CERTIFICADOS */}
      <FormSection
        title="Certificados"
        isOpen={openSections.certificates}
        onToggle={() => toggleSection('certificates')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
          </svg>
        }
      >
        <div className="section-list">
          {data.certificates.map((cert, index) => (
            <div key={cert.id} className="item-card">
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
                    disabled={index === data.certificates.length - 1}
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
                      placeholder="Ex: Frontend Masters, Alura"
                      value={cert.organization}
                      onChange={(e) => onUpdateCertificate(cert.id, 'organization', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ano de Emissão</label>
                    <input
                      type="text"
                      placeholder="Ex: 2024"
                      value={cert.date}
                      onChange={(e) => onUpdateCertificate(cert.id, 'date', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-add" onClick={onAddCertificate}>
            + Adicionar Certificado
          </button>
        </div>
      </FormSection>

      {/* 7. COMPETÊNCIAS / SKILLS */}
      <FormSection
        title="Competências (Skills)"
        isOpen={openSections.skills}
        onToggle={() => toggleSection('skills')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        }
      >
        <form onSubmit={handleAddSkillSubmit} className="skills-form">
          <input
            type="text"
            placeholder="Digite e aperte Enter. Ex: React"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">Adicionar</button>
        </form>

        <div className="skills-tags-container">
          {data.skills.map((skill, index) => (
            <span key={`${skill}-${index}`} className="skill-tag">
              {skill}
              <button
                type="button"
                className="skill-tag-remove"
                onClick={() => onRemoveSkill(skill)}
                title={`Remover ${skill}`}
              >
                ×
              </button>
            </span>
          ))}
          {data.skills.length === 0 && (
            <p className="empty-text">Nenhuma competência adicionada.</p>
          )}
        </div>
      </FormSection>

      {/* 8. IDIOMAS */}
      <FormSection
        title="Idiomas"
        isOpen={openSections.languages}
        onToggle={() => toggleSection('languages')}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        }
      >
        <div className="section-list">
          {data.languages.map((lang) => (
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
      </FormSection>
    </aside>
  );
}
