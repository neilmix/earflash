import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMatcher } from '../public/js/matcher.js';

const opts = { toleranceCents: 25, holdMs: 500, dropoutMs: 120 };
const T = 440;
const cents = c => T * 2 ** (c / 1200);

test('matches after holding within tolerance for holdMs', () => {
  const m = createMatcher(opts);
  let r;
  for (let t = 0; t <= 480; t += 20) { r = m.update(cents(10), T, t); assert.equal(r.matched, false); }
  r = m.update(cents(10), T, 500);
  assert.equal(r.matched, true);
});

test('reports cents offset', () => {
  const m = createMatcher(opts);
  const r = m.update(cents(-40), T, 0);
  assert.ok(Math.abs(r.cents + 40) < 1e-6);
});

test('out-of-tolerance resets hold', () => {
  const m = createMatcher(opts);
  m.update(cents(0), T, 0);
  m.update(cents(0), T, 300);
  m.update(cents(60), T, 320);
  assert.equal(m.update(cents(0), T, 520).matched, false);
  assert.equal(m.update(cents(0), T, 840).matched, false);
  assert.equal(m.update(cents(0), T, 1020).matched, true);
});

test('wrong octave never matches', () => {
  const m = createMatcher(opts);
  let r;
  for (let t = 0; t <= 2000; t += 20) r = m.update(T * 2, T, t);
  assert.equal(r.matched, false);
});

test('short dropouts (null) are tolerated, long ones reset', () => {
  const m = createMatcher(opts);
  m.update(cents(0), T, 0);
  m.update(null, T, 100);
  m.update(null, T, 200); // 200ms since last good < dropout? no: 200 > 120 -> reset
  assert.equal(m.update(cents(0), T, 520).matched, false);

  const m2 = createMatcher(opts);
  m2.update(cents(0), T, 0);
  m2.update(cents(0), T, 200);
  m2.update(null, T, 260);
  m2.update(cents(0), T, 300);
  assert.equal(m2.update(cents(0), T, 500).matched, true);
});

test('reset clears hold', () => {
  const m = createMatcher(opts);
  m.update(cents(0), T, 0);
  m.reset();
  assert.equal(m.update(cents(0), T, 500).matched, false);
});
