import { pitchClass } from './notes.js';

export function intervalWeight(semitones, sel) {
  const d = Math.abs(semitones);
  return d < sel.intervalWeights.length ? sel.intervalWeights[d] : sel.beyondOctaveWeight;
}

export function noteWeights({ prevMidi, key, played, notesInKey, range, sel }) {
  const pcw = sel.pitchClassWeights[key.mode];
  const boost = 1 + sel.unplayedBoostRate * notesInKey;
  const out = [];
  for (let midi = range.lowMidi; midi <= range.highMidi; midi++) {
    const pc = pitchClass(midi);
    let w = pcw[pitchClass(pc - key.tonic)];
    if (prevMidi != null) w *= intervalWeight(midi - prevMidi, sel);
    if (!played.has(pc)) w *= boost;
    out.push({ midi, weight: w });
  }
  return out;
}

export function pickWeighted(items, rng = Math.random) {
  const total = items.reduce((s, x) => s + x.weight, 0);
  let r = rng() * total;
  for (const x of items) {
    if (x.weight <= 0) continue;
    r -= x.weight;
    if (r < 0) return x;
  }
  return items.findLast(x => x.weight > 0);
}

function randomKey(rng, modes, exclude) {
  let k;
  do {
    k = { tonic: Math.floor(rng() * 12), mode: modes[Math.floor(rng() * modes.length)] };
  } while (exclude && k.tonic === exclude.tonic && k.mode === exclude.mode);
  return k;
}

export function createSelector({ config, rng = Math.random }) {
  const sel = config.selection;
  const state = {
    key: randomKey(rng, sel.modes),
    played: new Set(),
    notesInKey: 0,
    prevMidi: null,
    next() {
      const weights = noteWeights({ ...state, range: config.range, sel });
      const midi = pickWeighted(weights, rng).midi;
      state.prevMidi = midi;
      state.played.add(pitchClass(midi));
      state.notesInKey++;
      if (state.played.size === 12) {
        state.key = randomKey(rng, sel.modes, state.key);
        state.played = new Set();
        state.notesInKey = 0;
      }
      return midi;
    },
  };
  return state;
}
