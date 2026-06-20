interface ObjectiveFormProps {
  objective: string;
  onChangeObjective: (value: string) => void;
}

export default function ObjectiveForm({ objective, onChangeObjective }: ObjectiveFormProps) {
  return (
    <div className="form-group">
      <label htmlFor="objective-textarea">Sobre Você</label>
      <textarea
        id="objective-textarea"
        rows={5}
        placeholder="Escreva um breve resumo destacando suas principais competências, experiências e objetivos profissionais..."
        value={objective}
        onChange={(e) => onChangeObjective(e.target.value)}
      />
    </div>
  );
}
