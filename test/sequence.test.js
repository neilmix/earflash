import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSequence } from '../public/js/sequence.js';

function fakeSelector(notes) {
  let i = 0;
  return { next: () => notes[i++] };
}

test('advances through selector on match', () => {
  const s = createSequence(fakeSelector([60, 62, 64]));
  assert.equal(s.start(), 60);
  assert.equal(s.matched(), 62);
  assert.equal(s.matched(), 64);
});

test('fail rewinds to previous, then returns to the attempted note', () => {
  const s = createSequence(fakeSelector([60, 62, 64]));
  s.start();
  s.matched(); // now 62
  assert.equal(s.failed(), 60);
  assert.equal(s.matched(), 62);
  assert.equal(s.matched(), 64);
});

test('rewinding is true only while replaying the previous note', () => {
  const s = createSequence(fakeSelector([60, 62, 64]));
  s.start();
  assert.equal(s.rewinding, false);
  s.failed(); // first note: retry, not a rewind
  assert.equal(s.rewinding, false);
  s.matched(); // 62
  s.failed(); // 60
  assert.equal(s.rewinding, true);
  s.matched(); // back at 62
  assert.equal(s.rewinding, false);
  s.failed();
  s.start();
  assert.equal(s.rewinding, false);
});

test('repeated fails on attempted note rewind each time', () => {
  const s = createSequence(fakeSelector([60, 62, 64]));
  s.start();
  s.matched();
  s.failed();
  s.matched(); // back at 62
  assert.equal(s.failed(), 60);
  assert.equal(s.matched(), 62);
  assert.equal(s.matched(), 64);
});

test('fail on first note retries it', () => {
  const s = createSequence(fakeSelector([60, 62]));
  s.start();
  assert.equal(s.failed(), 60);
  assert.equal(s.matched(), 62);
});

test('start clears history', () => {
  const s = createSequence(fakeSelector([60, 62, 64, 65]));
  s.start();
  s.matched(); // 62
  assert.equal(s.start(), 64);
  assert.equal(s.failed(), 64);
});
