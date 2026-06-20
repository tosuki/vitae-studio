import { useState, FormEvent } from 'react';

interface SkillsFormProps {
  skillsList: string[];
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
}

export default function SkillsForm({ skillsList, onAddSkill, onRemoveSkill }: SkillsFormProps) {
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkillSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newSkill.trim()) {
      onAddSkill(newSkill.trim());
      setNewSkill('');
    }
  };

  return (
    <>
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
        {skillsList.map((skill, index) => (
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
        {skillsList.length === 0 && (
          <p className="empty-text">Nenhuma competência adicionada.</p>
        )}
      </div>
    </>
  );
}
