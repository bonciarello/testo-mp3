import { useId } from 'react';

export default function TextInput({ text, onChange, maxLength = 5000, disabled = false }) {
  const id = useId();
  const charCount = text.length;
  const isNearLimit = charCount > maxLength * 0.85;
  const isOverLimit = charCount > maxLength;

  return (
    <div className="text-input-group">
      <label htmlFor={id} className="field-label">
        Testo da convertire
        <span className="char-count" data-near={isNearLimit || undefined} data-over={isOverLimit || undefined}>
          {charCount}/{maxLength}
        </span>
      </label>
      <textarea
        id={id}
        className="text-area"
        value={text}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder="Incolla o scrivi il testo che vuoi trasformare in audio MP3..."
        rows={6}
        disabled={disabled}
        aria-describedby={id + '-hint'}
      />
      <span id={id + '-hint'} className="field-hint">
        {isOverLimit
          ? `Hai superato il limite di ${maxLength} caratteri. Il testo in eccesso sarà ignorato.`
          : 'Scrivi il testo che vuoi convertire in un file audio MP3 tramite sintesi vocale.'}
      </span>
    </div>
  );
}
