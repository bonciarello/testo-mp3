import { useState, useCallback, useRef } from 'react';
import { isDisplayMediaSupported, isMediaRecorderSupported } from '../utils/audioUtils';
import { blobToAudioBuffer, audioBufferToPCM, encodeToMp3 } from '../utils/mp3Encoder';

/**
 * Hook to record system/tab audio and export as MP3.
 * Uses getDisplayMedia + MediaRecorder + lamejs encoding.
 */
export function useAudioRecorder() {
  const [recordingSupported] = useState(() =>
    isDisplayMediaSupported() && isMediaRecorderSupported()
  );
  const [recording, setRecording] = useState(false);
  const [captureStream, setCaptureStream] = useState(null);
  const [error, setError] = useState(null);
  const audioCtxRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const resolveRef = useRef(null);

  // Get or create AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Acquire display media stream for audio capture
  const acquireStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: { width: 1, height: 1, frameRate: 1 },
      });
      // Stop video tracks immediately (we only need audio)
      stream.getVideoTracks().forEach(track => track.stop());
      setCaptureStream(stream);
      setError(null);
      return stream;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permesso negato. Devi consentire la condivisione dello schermo per registrare l\'audio.');
      } else if (err.name === 'NotFoundError') {
        setError('Nessuna sorgente audio trovata. Assicurati di selezionare una scheda del browser.');
      } else {
        setError(`Errore durante l\'acquisizione audio: ${err.message}`);
      }
      throw err;
    }
  }, []);

  // Release the capture stream
  const releaseStream = useCallback(() => {
    if (captureStream) {
      captureStream.getTracks().forEach(track => track.stop());
      setCaptureStream(null);
    }
  }, [captureStream]);

  /**
   * Record audio while speech is playing, then encode to MP3.
   * @param {() => Promise<void>} playFn - Function that triggers speech synthesis
   * @returns {Promise<Blob>} MP3 audio blob
   */
  const recordAndEncode = useCallback(async (playFn) => {
    if (!recordingSupported) {
      throw new Error('La registrazione audio non è supportata in questo browser.');
    }

    setError(null);
    setRecording(true);
    chunksRef.current = [];

    try {
      // Acquire or reuse stream
      let stream = captureStream;
      if (!stream || !stream.active) {
        stream = await acquireStream();
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error('Nessuna traccia audio disponibile. Seleziona una scheda del browser quando richiesto.');
      }

      // Create a new MediaStream with just the audio track
      const audioStream = new MediaStream([audioTrack]);

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(audioStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Collect chunks
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Wrap recording in a promise
      const recordingPromise = new Promise((resolve, reject) => {
        resolveRef.current = { resolve, reject };

        mediaRecorder.onstop = async () => {
          try {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            chunksRef.current = [];

            if (blob.size === 0) {
              throw new Error('Nessun dato audio registrato. Verifica che il testo non sia vuoto e riprova.');
            }

            // Decode WebM to AudioBuffer
            const audioCtx = getAudioContext();
            const audioBuffer = await blobToAudioBuffer(blob, audioCtx);

            // Extract PCM samples
            const { samples, sampleRate, channels } = audioBufferToPCM(audioBuffer);

            // Encode to MP3
            const mp3Blob = encodeToMp3(samples, sampleRate, channels, 128);

            resolve(mp3Blob);
          } catch (err) {
            reject(err);
          }
        };

        mediaRecorder.onerror = (e) => {
          reject(new Error(`Errore di registrazione: ${e.error?.message || 'Errore sconosciuto'}`));
        };
      });

      // Start recording
      mediaRecorder.start();

      // Small delay to ensure recorder is ready
      await new Promise(r => setTimeout(r, 250));

      // Play the speech
      await playFn();

      // Wait a bit for any trailing audio
      await new Promise(r => setTimeout(r, 500));

      // Stop recording
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }

      const mp3Blob = await recordingPromise;
      return mp3Blob;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setRecording(false);
      mediaRecorderRef.current = null;
    }
  }, [recordingSupported, captureStream, acquireStream, getAudioContext]);

  return {
    recordingSupported,
    recording,
    error,
    setError,
    captureStream,
    recordAndEncode,
    releaseStream,
  };
}
