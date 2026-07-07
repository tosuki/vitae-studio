import { PersonalData } from '../../types/cv.model';

interface PersonalFormProps {
  personalData: PersonalData;
  onChangePersonal: (field: keyof PersonalData, value: string) => void;
}

export default function PersonalForm({ personalData, onChangePersonal }: PersonalFormProps) {
  return (
    <>
      <div className="form-group">
        <label htmlFor="personal-name">Nome Completo</label>
        <input
          id="personal-name"
          type="text"
          placeholder="Ex: Gabriel Silva Santos"
          value={personalData.fullName}
          onChange={(e) => onChangePersonal('fullName', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="personal-title">Cargo / Título Profissional</label>
        <input
          id="personal-title"
          type="text"
          placeholder="Ex: Desenvolvedor Frontend Senior"
          value={personalData.title}
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
            value={personalData.email}
            onChange={(e) => onChangePersonal('email', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="personal-phone">Telefone</label>
          <input
            id="personal-phone"
            type="tel"
            placeholder="Ex: (11) 98765-4321"
            value={personalData.phone}
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
          value={personalData.location}
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
            value={personalData.linkedin}
            onChange={(e) => onChangePersonal('linkedin', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="personal-github">GitHub (Link ou Usuário)</label>
          <input
            id="personal-github"
            type="text"
            placeholder="Ex: github.com/usuario"
            value={personalData.github}
            onChange={(e) => onChangePersonal('github', e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
