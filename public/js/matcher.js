import { centsBetween } from './notes.js';

export function createMatcher({ toleranceCents, holdMs, dropoutMs }) {
  let holdStart = null;
  let lastGood = null;
  return {
    reset() { holdStart = null; lastGood = null; },
    update(freq, target, now) {
      if (freq == null) {
        if (lastGood != null && now - lastGood > dropoutMs) holdStart = lastGood = null;
        return { cents: null, matched: false };
      }
      const cents = centsBetween(freq, target);
      if (Math.abs(cents) <= toleranceCents) {
        if (holdStart == null) holdStart = now;
        lastGood = now;
      } else {
        holdStart = lastGood = null;
      }
      return { cents, matched: holdStart != null && now - holdStart >= holdMs };
    },
  };
}
