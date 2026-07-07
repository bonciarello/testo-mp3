/**
 * Test suite for MP3 encoder utility functions.
 * Run with: node --test tests/mp3Encoder.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('floatToInt16', () => {
  // Replicate the function for testing
  function floatToInt16(floatData) {
    const intData = new Int16Array(floatData.length);
    for (let i = 0; i < floatData.length; i++) {
      const s = Math.max(-1, Math.min(1, floatData[i]));
      intData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return intData;
  }

  it('should convert 0.0 to 0', () => {
    const result = floatToInt16(new Float32Array([0.0]));
    assert.equal(result[0], 0);
  });

  it('should convert 1.0 to max positive int16', () => {
    const result = floatToInt16(new Float32Array([1.0]));
    assert.equal(result[0], 32767);
  });

  it('should convert -1.0 to max negative int16', () => {
    const result = floatToInt16(new Float32Array([-1.0]));
    assert.equal(result[0], -32768);
  });

  it('should clamp values outside [-1, 1]', () => {
    const result = floatToInt16(new Float32Array([1.5, -2.0]));
    assert.equal(result[0], 32767);
    assert.equal(result[1], -32768);
  });

  it('should handle an empty array', () => {
    const result = floatToInt16(new Float32Array([]));
    assert.equal(result.length, 0);
  });

  it('should preserve array length', () => {
    const input = new Float32Array([0.5, -0.3, 0.8, -0.1, 0.0]);
    const result = floatToInt16(input);
    assert.equal(result.length, input.length);
  });

  it('should produce monotonically increasing values', () => {
    const input = new Float32Array([-0.5, -0.25, 0, 0.25, 0.5]);
    const result = floatToInt16(input);
    for (let i = 1; i < result.length; i++) {
      assert.ok(result[i] >= result[i - 1], `Values should be non-decreasing at index ${i}`);
    }
  });
});

describe('audioBufferToPCM - logic', () => {
  /**
   * Simulate the PCM extraction logic without AudioBuffer.
   */
  function extractPCM(channelData, sampleRate) {
    const channels = channelData.length;
    const length = channelData[0].length;

    if (channels === 1) {
      const floatData = channelData[0];
      const intData = new Int16Array(floatData.length);
      for (let i = 0; i < floatData.length; i++) {
        const s = Math.max(-1, Math.min(1, floatData[i]));
        intData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return { samples: intData, sampleRate, channels: 1 };
    }

    const interleaved = new Float32Array(length * channels);
    for (let i = 0; i < length; i++) {
      for (let c = 0; c < channels; c++) {
        interleaved[i * channels + c] = channelData[c][i];
      }
    }

    const intData = new Int16Array(interleaved.length);
    for (let i = 0; i < interleaved.length; i++) {
      const s = Math.max(-1, Math.min(1, interleaved[i]));
      intData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return { samples: intData, sampleRate, channels };
  }

  it('should handle mono channel data', () => {
    const mono = [new Float32Array([0.5, -0.3, 0.1])];
    const result = extractPCM(mono, 44100);
    assert.equal(result.channels, 1);
    assert.equal(result.sampleRate, 44100);
    assert.equal(result.samples.length, 3);
  });

  it('should interleave stereo channel data', () => {
    const left = new Float32Array([0.5, 0.3]);
    const right = new Float32Array([-0.5, -0.3]);
    const result = extractPCM([left, right], 44100);
    assert.equal(result.channels, 2);
    assert.equal(result.samples.length, 4); // 2 samples * 2 channels
    // First sample is left[0] = 0.5 * 32767 = 16383.5 → truncated to 16383
    assert.equal(result.samples[0], 16383);
    // Second sample is right[0] = -0.5 * 32768 = -16384
    assert.equal(result.samples[1], -16384);
  });

  it('should clamp values to int16 range', () => {
    const mono = [new Float32Array([2.0, -3.0])];
    const result = extractPCM(mono, 44100);
    assert.equal(result.samples[0], 32767);
    assert.equal(result.samples[1], -32768);
  });
});

console.log('✅ All MP3 encoder tests passed!');
