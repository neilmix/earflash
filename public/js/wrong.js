import { centsBetween } from './notes.js';

// Detects a steady wrong note: a pitch at least minCents from the target (any octave),
// staying within stableCents of where it started for holdMs.
// ignore(freq) exempts a still-sounding pitch (e.g. the note just matched) until it
// stops or the player moves off it.
export function createWrongDetector({ minCents, holdMs, stableCents, dropoutMs }) {
  let anchor = null;
  let holdStart = null;
  let lastSeen = null;
  let ignored = null;
  const clearHold = () => { anchor = holdStart = null; };
  return {
    reset() { clearHold(); lastSeen = null; },
    ignore(freq) { ignored = freq; clearHold(); },
    update(freq, target, now) {
      if (freq == null) {
        if (lastSeen != null && now - lastSeen > dropoutMs) { clearHold(); ignored = lastSeen = null; }
        return false;
      }
      lastSeen = now;
      if (ignored != null) {
        if (Math.abs(centsBetween(freq, ignored)) <= stableCents) return false;
        ignored = null;
      }
      if (Math.abs(centsBetween(freq, target)) < minCents) { clearHold(); return false; }
      if (anchor == null || Math.abs(centsBetween(freq, anchor)) > stableCents) {
        anchor = freq;
        holdStart = now;
      }
      return now - holdStart >= holdMs;
    },
  };
}
