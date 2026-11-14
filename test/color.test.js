import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proximity, proximityHue } from '../public/js/color.js';

const o = { toleranceCents: 25, farCents: 300 };

test('full green inside tolerance', () => {
  assert.equal(proximity(0, o), 1);
  assert.equal(proximity(25, o), 1);
  assert.equal(proximity(-25, o), 1);
  assert.equal(proximityHue(10, o), 120);
});

test('full red at or beyond farCents, incl. octave errors', () => {
  assert.equal(proximity(300, o), 0);
  assert.equal(proximity(-1200, o), 0);
  assert.equal(proximityHue(1200, o), 0);
});

test('monotonic between tolerance and far', () => {
  let last = 1;
  for (let c = 30; c <= 300; c += 10) {
    const p = proximity(c, o);
    assert.ok(p <= last && p >= 0);
    last = p;
  }
});
