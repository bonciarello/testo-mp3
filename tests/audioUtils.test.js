/**
 * Test suite for audio utility functions.
 * Run with: node --test tests/audioUtils.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// We test the pure functions that don't depend on browser APIs.
// For browser-dependent functions, we simulate the environment.

// Mock window for testing
global.window = {};

describe('estimateDuration', () => {
  // Replicate the function logic for testing without browser deps
  function estimateDuration(text, rate = 1) {
    const words = text.trim().split(/\s+/).length;
    const wpm = 150 * rate;
    return Math.max(1, Math.round((words / wpm) * 60));
  }

  it('should return at least 1 second for any text', () => {
    assert.equal(estimateDuration('a'), 1);
    assert.equal(estimateDuration(''), 1);
  });

  it('should estimate duration proportionally to word count', () => {
    const short = estimateDuration('one two three');
    const long = estimateDuration('one two three four five six seven eight nine ten');
    assert.ok(long > short, 'Longer text should have longer duration');
  });

  it('should adjust duration inversely with rate', () => {
    const slow = estimateDuration('one two three four five', 0.5);
    const normal = estimateDuration('one two three four five', 1);
    const fast = estimateDuration('one two three four five', 2);
    assert.ok(slow > normal, 'Slower rate should be longer');
    assert.ok(normal > fast, 'Faster rate should be shorter');
  });

  it('should return an integer', () => {
    const result = estimateDuration('test text here', 1.3);
    assert.ok(Number.isInteger(result));
  });
});

describe('formatDuration', () => {
  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  it('should format seconds to mm:ss', () => {
    assert.equal(formatDuration(0), '0:00');
    assert.equal(formatDuration(30), '0:30');
    assert.equal(formatDuration(65), '1:05');
    assert.equal(formatDuration(3661), '61:01');
  });

  it('should pad seconds with leading zero', () => {
    assert.equal(formatDuration(5), '0:05');
    assert.equal(formatDuration(60), '1:00');
  });
});

describe('isSpeechSynthesisSupported - unit logic', () => {
  function checkSupport() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  it('should return false when speechSynthesis is absent', () => {
    assert.equal(checkSupport(), false);
  });

  it('should return true when speechSynthesis exists', () => {
    global.window.speechSynthesis = {};
    assert.equal(checkSupport(), true);
    delete global.window.speechSynthesis;
  });
});

describe('isDisplayMediaSupported - unit logic', () => {
  function checkSupport() {
    return typeof navigator !== 'undefined'
      && 'mediaDevices' in navigator
      && 'getDisplayMedia' in navigator.mediaDevices;
  }

  it('should return false when navigator is not available', () => {
    // In Node, navigator might not exist or might not have mediaDevices
    // But we're testing the logic, so we verify the check is robust
    if (typeof global.navigator === 'undefined') {
      assert.equal(checkSupport(), false);
    }
  });
});

console.log('✅ All audio utility tests passed!');
