/**
 * MP3 encoder utility using lamejs.
 * Converts raw PCM Int16 samples to MP3 Blob.
 */
import { Mp3Encoder } from 'lamejs';

/**
 * Encode raw PCM Int16 samples to MP3.
 * @param {Int16Array} samples - Interleaved stereo or mono samples
 * @param {number} sampleRate - Sample rate in Hz
 * @param {number} channels - Number of channels (1 or 2)
 * @param {number} bitRate - MP3 bitrate in kbps (default 128)
 * @returns {Blob} MP3 audio blob
 */
export function encodeToMp3(samples, sampleRate, channels = 1, bitRate = 128) {
  const encoder = new Mp3Encoder(channels, sampleRate, bitRate);

  if (channels === 1) {
    const buf = encoder.encodeBuffer(samples);
    const end = encoder.flush();
    const mp3Data = new Uint8Array(buf.length + end.length);
    mp3Data.set(buf, 0);
    mp3Data.set(end, buf.length);
    return new Blob([mp3Data], { type: 'audio/mp3' });
  }

  // Stereo: split interleaved samples
  const left = new Int16Array(samples.length / 2);
  const right = new Int16Array(samples.length / 2);
  for (let i = 0; i < samples.length / 2; i++) {
    left[i] = samples[i * 2];
    right[i] = samples[i * 2 + 1];
  }
  const buf = encoder.encodeBuffer(left, right);
  const end = encoder.flush();
  const mp3Data = new Uint8Array(buf.length + end.length);
  mp3Data.set(buf, 0);
  mp3Data.set(end, buf.length);
  return new Blob([mp3Data], { type: 'audio/mp3' });
}

/**
 * Convert Float32Array audio data to Int16Array for MP3 encoding.
 * @param {Float32Array} floatData - Float32 audio samples (-1.0 to 1.0)
 * @returns {Int16Array}
 */
export function floatToInt16(floatData) {
  const intData = new Int16Array(floatData.length);
  for (let i = 0; i < floatData.length; i++) {
    const s = Math.max(-1, Math.min(1, floatData[i]));
    intData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return intData;
}

/**
 * Create an AudioBuffer from a Blob (WebM/audio data).
 * @param {Blob} blob - Audio blob
 * @param {AudioContext} audioCtx
 * @returns {Promise<AudioBuffer>}
 */
export async function blobToAudioBuffer(blob, audioCtx) {
  const arrayBuffer = await blob.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * Extract interleaved Int16 PCM samples from an AudioBuffer.
 * @param {AudioBuffer} audioBuffer
 * @returns {{ samples: Int16Array, sampleRate: number, channels: number }}
 */
export function audioBufferToPCM(audioBuffer) {
  const channels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;

  // Get channel data and interleave
  const channelData = [];
  for (let c = 0; c < channels; c++) {
    channelData.push(audioBuffer.getChannelData(c));
  }

  if (channels === 1) {
    return {
      samples: floatToInt16(channelData[0]),
      sampleRate,
      channels: 1,
    };
  }

  // Interleave stereo
  const interleaved = new Float32Array(length * channels);
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < channels; c++) {
      interleaved[i * channels + c] = channelData[c][i];
    }
  }

  return {
    samples: floatToInt16(interleaved),
    sampleRate,
    channels,
  };
}
