import { useState, useCallback, useRef } from 'react';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { estimateDuration } from './utils/audioUtils';
import TextInput from './components/TextInput';
import VoiceControls from './components/VoiceControls';
import AudioControls from './components/AudioControls';
import WaveformVisualizer from './components/WaveformVisualizer';
import ErrorBanner from './components/ErrorBanner';

export default function App() {
  const [text, setText] = useState('');
  const [bannerMsg, setBannerMsg] = useState(null);
  const [bannerType, setBannerType] = useState('error');

  const synth = useSpeechSynthesis();
  const recorder = useAudioRecorder();

  const showBanner = useCallback((msg, type = 'error') => {
    setBannerMsg(msg);
    setBannerType(type);
    // Auto-dismiss warnings after 8s
    if (type === 'warning') {
      setTimeout(() => setBannerMsg(null), 8000);
    }
  }, []);

  const dismissBanner = useCallback(() => setBannerMsg(null), []);

  // Preview playback
  const handlePreview = useCallback(() => {
    if (!text.trim()) return;
    synth.speak(text);
  }, [text, synth]);

  const handlePause = useCallback(() => {
    synth.pause();
  }, [synth]);

  const handleResume = useCallback(() => {
    synth.resume();
  }, [synth]);

  const handleStop = useCallback(() => {
    synth.cancel();
  }, [synth]);

  // Download MP3
  const handleDownload = useCallback(async () => {
    if (!text.trim()) return;

    // Stop any ongoing preview
    synth.cancel();

    // Capture current synth settings (they won't change during recording)
    const currentRate = synth.rate;
    const currentPitch = synth.pitch;
    const currentVoice = synth.selectedVoice;

    try {
      const mp3Blob = await recorder.recordAndEncode(async () => {
        // Play the speech for recording
        return new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = currentRate;
          utterance.pitch = currentPitch;
          if (currentVoice) {
            utterance.voice = currentVoice;
          }
          utterance.volume = 1;
          utterance.onend = () => resolve();
          utterance.onerror = (e) => {
            if (e.error === 'canceled' || e.error === 'interrupted') {
              resolve();
            } else {
              resolve(); // Still resolve to not hang
            }
          };
          window.speechSynthesis.speak(utterance);
        });
      });

      // Trigger download
      const url = URL.createObjectURL(mp3Blob);
      const a = document.createElement('a');
      a.href = url;
      // Generate filename from first 30 chars of text
      const safeText = text.trim().replace(/[^a-zA-Z0-9à-ü\s]/g, '').slice(0, 30).trim() || 'audio';
      a.download = `${safeText.replace(/\s+/g, '_')}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showBanner('File MP3 scaricato con successo!', 'success');
      setTimeout(() => setBannerMsg(null), 5000);
    } catch (err) {
      if (err.message && !err.message.includes('Permesso negato')) {
        showBanner(err.message, 'error');
      }
    }
  }, [text, recorder, synth, showBanner]);

  // Handle recorder errors in banner
  const displayError = recorder.error || bannerMsg;
  const displayType = recorder.error ? 'error' : bannerType;

  // Browser support check
  if (!synth.supported) {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">Convertitore Testo → Audio MP3</h1>
          <p className="app-subtitle">Sintesi vocale direttamente nel browser</p>
        </header>
        <main className="app-main">
          <ErrorBanner
            message="Il tuo browser non supporta la Web Speech API. Per usare questo strumento, apri la pagina con Google Chrome, Microsoft Edge o Safari (versioni recenti)."
            type="error"
          />
        </main>
        <footer className="app-footer">
          <p>Convertitore di testo in file audio MP3 con sintesi vocale — Nessuna registrazione, gratis e senza API key.</p>
        </footer>
      </div>
    );
  }

  const estimatedTime = estimateDuration(text, synth.rate);
  const isProcessing = synth.playing || recorder.recording;

  return (
    <div className="app">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Convertitore Testo in Audio MP3',
            url: 'https://cristianporco.it/app/convertitore-di-testo-in-file-audio-mp3-con-sintesi-vocale/',
            description: 'Converti qualsiasi testo in file audio MP3 con sintesi vocale direttamente nel browser. Regola velocità, tono e voce.',
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Any',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
            browserRequirements: 'Requires Web Speech API support (Chrome, Edge, Safari)',
          }),
        }}
      />

      <header className="app-header">
        <h1 className="app-title">Convertitore Testo → Audio MP3</h1>
        <p className="app-subtitle">
          Trasforma qualsiasi testo in un file audio scaricabile con la sintesi vocale del tuo browser.
          Scegli voce, velocità e tono — poi ascolta l&rsquo;anteprima o scarica l&rsquo;MP3.
        </p>
      </header>

      <main className="app-main">
        {displayError && (
          <ErrorBanner
            message={displayError}
            type={displayType}
            onDismiss={recorder.error ? () => recorder.setError(null) : dismissBanner}
          />
        )}

        <WaveformVisualizer active={synth.playing || recorder.recording} />

        <TextInput
          text={text}
          onChange={setText}
          disabled={isProcessing}
        />

        <VoiceControls
          voices={synth.voices}
          selectedVoice={synth.selectedVoice}
          onVoiceChange={synth.setSelectedVoice}
          rate={synth.rate}
          onRateChange={synth.setRate}
          pitch={synth.pitch}
          onPitchChange={synth.setPitch}
          disabled={isProcessing}
        />

        <AudioControls
          text={text}
          playing={synth.playing}
          paused={synth.paused}
          recording={recorder.recording}
          recordingSupported={recorder.recordingSupported}
          hasStream={!!recorder.captureStream}
          onPreview={handlePreview}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onDownload={handleDownload}
          disabled={isProcessing}
        />

        <div className="meta-info">
          <p>
            <span className="mono">Tempo stimato:</span> ~{estimatedTime}s
            &nbsp;·&nbsp;
            <span className="mono">Caratteri:</span> {text.length}
            &nbsp;·&nbsp;
            <span className="mono">Voce:</span> {synth.selectedVoice?.name || 'Predefinita'}
          </p>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Convertitore di testo in file audio MP3 con sintesi vocale.
          Funziona completamente nel browser — nessuna registrazione, nessuna API key, gratis.
          Richiede Chrome, Edge o Safari con supporto Web Speech API.
        </p>
      </footer>
    </div>
  );
}
