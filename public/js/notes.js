export const midiToFreq = midi => 440 * 2 ** ((midi - 69) / 12);
export const centsBetween = (freq, ref) => 1200 * Math.log2(freq / ref);
export const pitchClass = midi => ((midi % 12) + 12) % 12;
