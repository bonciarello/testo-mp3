export default function AudioControls({
  text,
  playing,
  paused,
  recording,
  recordingSupported,
  hasStream,
  onPreview,
  onPause,
  onResume,
  onStop,
  onDownload,
  disabled,
}) {
  const hasText = text.trim().length > 0;

  return (
    <div className="audio-controls">
      {/* Preview section */}
      <div className="btn-group">
        {!playing ? (
          <button
            className="btn btn-primary"
            onClick={onPreview}
            disabled={disabled || !hasText}
            aria-label="Riproduci anteprima"
          >
            <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Ascolta anteprima
          </button>
        ) : (
          <div className="btn-group btn-group-inline">
            {paused ? (
              <button
                className="btn btn-primary"
                onClick={onResume}
                aria-label="Riprendi anteprima"
              >
                <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Riprendi
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={onPause}
                aria-label="Metti in pausa"
              >
                <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                Pausa
              </button>
            )}
            <button
              className="btn btn-ghost"
              onClick={onStop}
              aria-label="Ferma anteprima"
            >
              <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
              Ferma
            </button>
          </div>
        )}
      </div>

      {/* Download section */}
      <div className="btn-group">
        <button
          className="btn btn-accent"
          onClick={onDownload}
          disabled={disabled || !hasText || recording}
          aria-label="Scarica file MP3"
        >
          {recording ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Registrazione in corso…
            </>
          ) : (
            <>
              <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Scarica MP3
            </>
          )}
        </button>
      </div>

      {!recordingSupported && (
        <p className="info-note">
          <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Per scaricare l'MP3 usa Chrome o Edge: la registrazione audio richiede la condivisione della scheda.
        </p>
      )}
    </div>
  );
}
