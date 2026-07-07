import { useId } from 'react';

export default function VoiceControls({
  voices,
  selectedVoice,
  onVoiceChange,
  rate,
  onRateChange,
  pitch,
  onPitchChange,
  disabled = false,
}) {
  const voiceId = useId();
  const rateId = useId();
  const pitchId = useId();

  const selectedLang = selectedVoice
    ? `${selectedVoice.name} (${selectedVoice.lang})`
    : '';

  return (
    <fieldset className="voice-controls" disabled={disabled}>
      <legend className="controls-legend">Parametri voce</legend>

      <div className="control-row">
        <div className="control-group control-voice">
          <label htmlFor={voiceId} className="field-label">Voce</label>
          <select
            id={voiceId}
            className="select-input"
            value={selectedVoice?.voiceURI || ''}
            onChange={(e) => {
              const voice = voices.find(v => v.voiceURI === e.target.value);
              if (voice) onVoiceChange(voice);
            }}
          >
            {voices.length === 0 && (
              <option value="">Caricamento voci...</option>
            )}
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang}) {voice.localService ? '• Locale' : '• Remota'}
              </option>
            ))}
          </select>
          {selectedLang && <span className="field-hint">{selectedLang}</span>}
        </div>
      </div>

      <div className="control-row control-row-dual">
        <div className="control-group">
          <label htmlFor={rateId} className="field-label">
            Velocità
            <span className="param-value mono">{rate.toFixed(2)}x</span>
          </label>
          <input
            id={rateId}
            type="range"
            className="range-input"
            min="0.25"
            max="4"
            step="0.05"
            value={rate}
            onChange={(e) => onRateChange(parseFloat(e.target.value))}
            aria-valuemin={0.25}
            aria-valuemax={4}
            aria-valuenow={rate}
            aria-valuetext={`${rate.toFixed(2)} volte`}
          />
          <div className="range-labels">
            <span>0.25x</span>
            <span>1x</span>
            <span>4x</span>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor={pitchId} className="field-label">
            Tono
            <span className="param-value mono">{pitch.toFixed(2)}</span>
          </label>
          <input
            id={pitchId}
            type="range"
            className="range-input"
            min="0"
            max="2"
            step="0.05"
            value={pitch}
            onChange={(e) => onPitchChange(parseFloat(e.target.value))}
            aria-valuemin={0}
            aria-valuemax={2}
            aria-valuenow={pitch}
            aria-valuetext={`${pitch.toFixed(2)}`}
          />
          <div className="range-labels">
            <span>0</span>
            <span>1</span>
            <span>2</span>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
