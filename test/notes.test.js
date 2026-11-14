import { test } from 'node:test';
import assert from 'node:assert/strict';
import { midiToFreq, centsBetween, pitchClass } from '../public/js/notes.js';

test('midiToFreq: A4 = 440', () => {
  assert.equal(midiToFreq(69), 440);
});

test('midiToFreq: Bb5 (82) ~ 932.33', () => {
  assert.ok(Math.abs(midiToFreq(82) - 932.33) < 0.01);
});

test('centsBetween: octave = 1200, unison = 0, sign follows direction', () => {
  assert.equal(centsBetween(880, 440), 1200);
  assert.equal(centsBetween(440, 440), 0);
  assert.ok(centsBetween(430, 440) < 0);
});

test('pitchClass wraps into 0..11', () => {
  assert.equal(pitchClass(60), 0);
  assert.equal(pitchClass(71), 11);
  assert.equal(pitchClass(50), 2);
});
