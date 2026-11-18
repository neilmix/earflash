import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWrongDetector } from '../public/js/wrong.js';

const opts = { minCents: 75, holdMs: 600, stableCents: 50, dropoutMs: 120 };
const T = 440;
const cents = c => T * 2 ** (c / 1200);

function run(d, freqAt, from, to, step = 20) {
  let r = false;
  for (let t = from; t <= to; t += step) if (d.update(freqAt(t), T, t)) r = true;
  return r;
}

test('steady wrong semitone held for holdMs fails', () => {
  const d = createWrongDetector(opts);
  assert.equal(run(d, () => cents(200), 0, 580), false);
  assert.equal(d.update(cents(200), T, 600), true);
});

test('near target (within minCents) never fails', () => {
  const d = createWrongDetector(opts);
  assert.equal(run(d, () => cents(-70), 0, 3000), false);
});

test('wrong octave fails', () => {
  const d = createWrongDetector(opts);
  assert.equal(run(d, () => T * 2, 0, 600), true);
});

test('sliding pitch is not a steady wrong note', () => {
  const d = createWrongDetector(opts);
  // glide 400 cents over 2s: never stays within stableCents for 600ms
  assert.equal(run(d, t => cents(-500 + t / 5), 0, 2000), false);
});

test('pitch change restarts the hold', () => {
  const d = createWrongDetector(opts);
  run(d, () => cents(200), 0, 400);
  assert.equal(run(d, () => cents(500), 420, 1000), false);
  assert.equal(d.update(cents(500), T, 1020), true);
});

test('short dropouts tolerated, long ones reset', () => {
  const d = createWrongDetector(opts);
  run(d, () => cents(200), 0, 300);
  d.update(null, T, 380);
  assert.equal(run(d, () => cents(200), 400, 600), true);

  const d2 = createWrongDetector(opts);
  run(d2, () => cents(200), 0, 300);
  d2.update(null, T, 500);
  assert.equal(run(d2, () => cents(200), 520, 1100), false);
  assert.equal(d2.update(cents(200), T, 1120), true);
});

test('ignored pitch does not fail while held', () => {
  const d = createWrongDetector(opts);
  d.ignore(cents(200));
  assert.equal(run(d, () => cents(210), 0, 3000), false);
});

test('ignore clears after silence', () => {
  const d = createWrongDetector(opts);
  d.ignore(cents(200));
  run(d, () => cents(200), 0, 500);
  d.update(null, T, 520);
  d.update(null, T, 700);
  assert.equal(run(d, () => cents(200), 720, 1320), true);
});

test('ignore clears when a different pitch is played', () => {
  const d = createWrongDetector(opts);
  d.ignore(cents(200));
  run(d, () => cents(200), 0, 500);
  assert.equal(run(d, () => cents(500), 520, 1100), false);
  assert.equal(d.update(cents(500), T, 1120), true);
  // returning to the formerly ignored pitch now counts
  const d2 = createWrongDetector(opts);
  d2.ignore(cents(200));
  run(d2, () => cents(500), 0, 100);
  assert.equal(run(d2, () => cents(200), 120, 720), true);
});

test('reset clears hold but keeps ignore', () => {
  const d = createWrongDetector(opts);
  run(d, () => cents(200), 0, 500);
  d.reset();
  assert.equal(d.update(cents(200), T, 600), false);

  const d2 = createWrongDetector(opts);
  d2.ignore(cents(200));
  d2.reset();
  assert.equal(run(d2, () => cents(200), 0, 2000), false);
});
