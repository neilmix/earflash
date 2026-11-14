import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../public/js/config.js';
import { noteWeights, pickWeighted, createSelector } from '../public/js/selector.js';
import { pitchClass } from '../public/js/notes.js';

function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const sel = CONFIG.selection;
const range = CONFIG.range;

test('noteWeights covers exactly the configured range', () => {
  const w = noteWeights({ prevMidi: 60, key: { tonic: 0, mode: 'major' }, played: new Set(), notesInKey: 0, range, sel });
  assert.equal(w.length, range.highMidi - range.lowMidi + 1);
  assert.equal(w[0].midi, range.lowMidi);
  assert.equal(w.at(-1).midi, range.highMidi);
});

test('noteWeights: diatonic step beats chromatic step', () => {
  const w = noteWeights({ prevMidi: 60, key: { tonic: 0, mode: 'major' }, played: new Set([0,1,2,3,4,5,6,7,8,9,10,11]), notesInKey: 0, range, sel });
  const d = w.find(x => x.midi === 62).weight; // D, whole step, diatonic
  const c = w.find(x => x.midi === 61).weight; // C#, half step, chromatic
  assert.ok(d > c);
});

test('noteWeights: step beats large leap for same scale degree class', () => {
  const w = noteWeights({ prevMidi: 60, key: { tonic: 0, mode: 'major' }, played: new Set(), notesInKey: 0, range, sel });
  const near = w.find(x => x.midi === 62).weight;
  const far = w.find(x => x.midi === 74).weight; // D an octave+step up
  assert.ok(near > far);
});

test('noteWeights: minor mode uses minor scale (Eb favored over E in C minor)', () => {
  const w = noteWeights({ prevMidi: 60, key: { tonic: 0, mode: 'minor' }, played: new Set(), notesInKey: 0, range, sel });
  assert.ok(w.find(x => x.midi === 63).weight > w.find(x => x.midi === 64).weight);
});

test('noteWeights: no repeat of the previous note by default', () => {
  const w = noteWeights({ prevMidi: 60, key: { tonic: 0, mode: 'major' }, played: new Set(), notesInKey: 0, range, sel });
  assert.equal(w.find(x => x.midi === 60).weight, 0);
});

test('noteWeights: unplayed boost grows with notesInKey', () => {
  const args = { prevMidi: 60, key: { tonic: 0, mode: 'major' }, played: new Set([0, 2, 4, 5, 7, 9, 11]), range, sel };
  const early = noteWeights({ ...args, notesInKey: 0 }).find(x => x.midi === 61).weight;
  const late = noteWeights({ ...args, notesInKey: 30 }).find(x => x.midi === 61).weight;
  const playedEarly = noteWeights({ ...args, notesInKey: 0 }).find(x => x.midi === 62).weight;
  const playedLate = noteWeights({ ...args, notesInKey: 30 }).find(x => x.midi === 62).weight;
  assert.ok(late > early * 2);
  assert.equal(playedEarly, playedLate);
});

test('noteWeights: first note (no prev) has no interval bias', () => {
  const w = noteWeights({ prevMidi: null, key: { tonic: 0, mode: 'major' }, played: new Set(), notesInKey: 0, range, sel });
  assert.equal(w.find(x => x.midi === 60).weight, w.find(x => x.midi === 72).weight);
});

test('pickWeighted respects zero weights and proportions', () => {
  const rng = seededRng(7);
  const items = [{ midi: 1, weight: 0 }, { midi: 2, weight: 3 }, { midi: 3, weight: 1 }];
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (let i = 0; i < 4000; i++) counts[pickWeighted(items, rng).midi]++;
  assert.equal(counts[1], 0);
  assert.ok(counts[2] / counts[3] > 2.5 && counts[2] / counts[3] < 3.5);
});

test('selector: notes stay in range and never repeat consecutively', () => {
  const s = createSelector({ config: CONFIG, rng: seededRng(3) });
  let prev = null;
  for (let i = 0; i < 2000; i++) {
    const m = s.next();
    assert.ok(m >= range.lowMidi && m <= range.highMidi);
    assert.notEqual(m, prev);
    prev = m;
  }
});

test('selector: key changes right after all 12 pitch classes are played', () => {
  const s = createSelector({ config: CONFIG, rng: seededRng(11) });
  const keyBefore = s.key;
  const seen = new Set();
  let n = 0;
  while (seen.size < 12) {
    seen.add(pitchClass(s.next()));
    n++;
    if (seen.size < 12) assert.equal(s.key, keyBefore);
  }
  assert.notEqual(s.key, keyBefore, 'new key object after completion');
  assert.equal(s.played.size, 0);
  assert.equal(s.notesInKey, 0);
  assert.ok(n < 200);
});

test('selector: boost keeps keys reasonably short on average', () => {
  const s = createSelector({ config: CONFIG, rng: seededRng(5) });
  let keys = 0;
  let key = s.key;
  for (let i = 0; i < 5000; i++) {
    s.next();
    if (s.key !== key) { keys++; key = s.key; }
  }
  const avg = 5000 / keys;
  assert.ok(avg < 50, `avg notes per key ${avg}`);
});

test('selector: chooses both modes and varied tonics over time', () => {
  const s = createSelector({ config: CONFIG, rng: seededRng(9) });
  const modes = new Set();
  const tonics = new Set();
  for (let i = 0; i < 20000; i++) {
    s.next();
    modes.add(s.key.mode);
    tonics.add(s.key.tonic);
  }
  assert.deepEqual([...modes].sort(), ['major', 'minor']);
  assert.ok(tonics.size >= 10);
});
