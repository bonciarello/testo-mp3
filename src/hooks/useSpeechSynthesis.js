import { useState, useCallback, useRef, useEffect } from 'react';
import { isSpeechSynthesisSupported, getVoices } from '../utils/audioUtils';

/**
 * Hook to manage Web Speech API synthesis.
 * Provides preview playback with configurable voice, rate, and pitch.
 */
export function useSpeechSynthesis() {
  const [supported] = useState(() => isSpeechSynthesisSupported());
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const utteranceRef = useRef(null);
  const synthRef = useRef(null);

  // Initialize voices (they load async in Chrome)
  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    synthRef.current = synth;

    const loadVoices = () => {
      const available = getVoices();
      setVoices(available);
      // Default to the first Italian voice, or first voice
      const italian = available.find(v => v.lang.startsWith('it'));
      setSelectedVoice(prev => prev || italian || available[0] || null);
    };

    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
    return () => synth.removeEventListener('voiceschanged', loadVoices);
  }, [supported]);

  // Cancel any ongoing speech
  const cancel = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setPlaying(false);
    setPaused(false);
  }, []);

  // Speak text for preview
  const speak = useCallback((text) => {
    if (!supported || !synthRef.current || !text.trim()) return;

    const synth = synthRef.current;
    synth.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.volume = 1;

    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => {
      setPlaying(false);
      setPaused(false);
    };
    utterance.onpause = () => setPaused(true);
    utterance.onresume = () => setPaused(false);
    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.error('Speech synthesis error:', e.error);
      }
      setPlaying(false);
      setPaused(false);
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [supported, rate, pitch, selectedVoice]);

  // Pause/resume
  const pause = useCallback(() => {
    if (synthRef.current && playing) {
      synthRef.current.pause();
    }
  }, [playing]);

  const resume = useCallback(() => {
    if (synthRef.current && paused) {
      synthRef.current.resume();
    }
  }, [paused]);

  return {
    supported,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    playing,
    paused,
    speak,
    cancel,
    pause,
    resume,
  };
}
