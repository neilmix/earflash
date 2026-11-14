import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPitch, rms } from '../public/js/pitch.js';
import { centsBetween, midiToFreq } from '../public/js/notes.js';

const SR = 48000;
const N = 2048;

function synth(freq, harmonics = [1], { noise = 0, sr = SR, n = N, phase = 0.3 } = {}) {
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    harmonics.forEach((a, k) => { v += a * Math.sin(2 * Math.PI * freq * (k + 1) * i / sr + phase * k); });
    buf[i] = v * 0.3 + (Math.random() * 2 - 1) * noise;
  }
  return buf;
}

// clarinet-ish: strong odd harmonics, weak even
const CLARINET = [1, 0.05, 0.6, 0.04, 0.35, 0.03, 0.2];

for (let midi = 50; midi <= 82; midi += 2) {
  const f = midiToFreq(midi);
  test(`detects sine at midi ${midi} (${f.toFixed(1)} Hz) within 5 cents`, () => {
    const r = detectPitch(synth(f), SR);
    assert.ok(r, 'detected');
    assert.ok(Math.abs(centsBetween(r.freq, f)) < 5, `got ${r.freq}`);
  });
  test(`detects clarinet-like tone at midi ${midi} without octave error`, () => {
    const r = detectPitch(synth(f, CLARINET, { noise: 0.02 }), SR);
    assert.ok(r, 'detected');
    assert.ok(Math.abs(centsBetween(r.freq, f)) < 10, `got ${r.freq} want ${f}`);
  });
}

test('works at 44.1 kHz', () => {
  const f = midiToFreq(57);
  const r = detectPitch(synth(f, CLARINET, { sr: 44100 }), 44100);
  assert.ok(Math.abs(centsBetween(r.freq, f)) < 10);
});

test('returns null for white noise', () => {
  const buf = new Float32Array(N).map(() => Math.random() * 2 - 1);
  assert.equal(detectPitch(buf, SR), null);
});

test('returns null for silence', () => {
  assert.equal(detectPitch(new Float32Array(N), SR), null);
});

test('rms of unit sine ~ 0.707', () => {
  const buf = new Float32Array(4800).map((_, i) => Math.sin(2 * Math.PI * 100 * i / SR));
  assert.ok(Math.abs(rms(buf) - Math.SQRT1_2) < 0.01);
});
