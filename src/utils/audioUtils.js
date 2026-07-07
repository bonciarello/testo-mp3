/**
 * Audio utility functions.
 */

/**
 * Check if the Web Speech API is available in this browser.
 * @returns {boolean}
 */
export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Get available voices, filtering to the best quality ones for the given language.
 * @param {string} [lang='it-IT'] - Language code
 * @returns {SpeechSynthesisVoice[]}
 */
export function getVoices(lang = 'it-IT') {
  const synth = window.speechSynthesis;
  if (!synth) return [];

  let voices = synth.getVoices();

  // Sort: prefer local voices, then the given language
  voices = [...voices].sort((a, b) => {
    // Prefer local voices
    if (a.localService && !b.localService) return -1;
    if (!a.localService && b.localService) return 1;
    // Prefer Italian voices
    const aIt = a.lang.startsWith('it');
    const bIt = b.lang.startsWith('it');
    if (aIt && !bIt) return -1;
    if (!aIt && bIt) return 1;
    return a.name.localeCompare(b.name);
  });

  return voices;
}

/**
 * Check if getDisplayMedia is supported for audio capture.
 * @returns {boolean}
 */
export function isDisplayMediaSupported() {
  return typeof navigator !== 'undefined'
    && 'mediaDevices' in navigator
    && 'getDisplayMedia' in navigator.mediaDevices;
}

/**
 * Check if the MediaRecorder API is available.
 * @returns {boolean}
 */
export function isMediaRecorderSupported() {
  return typeof window !== 'undefined' && 'MediaRecorder' in window;
}

/**
 * Format duration in seconds to mm:ss.
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Estimate speech duration based on text length and rate.
 * Very rough estimate: ~150 words per minute at rate 1.0.
 * @param {string} text
 * @param {number} rate
 * @returns {number} Estimated duration in seconds
 */
export function estimateDuration(text, rate = 1) {
  const words = text.trim().split(/\s+/).length;
  const wpm = 150 * rate;
  return Math.max(1, Math.round((words / wpm) * 60));
}
