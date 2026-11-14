// All tunables live here.
export const CONFIG = {
  // Sounding (concert) MIDI range of Bb clarinet, chalumeau + clarion:
  // written E3..C6 = concert D3 (50) .. Bb5 (82). No altissimo.
  range: { lowMidi: 50, highMidi: 82 },

  match: {
    toleranceCents: 25, // within this = in tune, full green
    holdMs: 500, // must stay in tune this long to count
    dropoutMs: 120, // brief detection gaps tolerated while holding
  },

  detection: {
    minFreq: 120,
    maxFreq: 1100,
    yinThreshold: 0.15, // lower = stricter periodicity requirement
    minRms: 0.01, // input quieter than this is ignored
    fftSize: 2048,
  },

  tone: {
    periodSec: 1.5, // replay interval
    decaySec: 1.5, // time to fade to silence
    attackSec: 0.12, // soft onset
    gain: 0.35,
    // Harmonic partials: [ratio, amplitude, decay multiplier (higher = faster fade)]
    partials: [
      [1, 1.0, 1],
      [2, 0.45, 1.8],
      [3, 0.2, 2.6],
      [4, 0.12, 3.5],
      [6, 0.05, 5],
    ],
    stopFadeSec: 0.08, // fade when a note is matched or play halts
  },

  selection: {
    // Weight per semitone above tonic (index 0 = tonic).
    pitchClassWeights: {
      //     1   b2  2  b3  3   4  #4  5  b6  6  b7   7
      major: [10, 1, 5, 1, 6, 5, 1, 8, 1, 5, 1, 4],
      minor: [10, 1, 5, 6, 1, 5, 1, 8, 5, 1, 4, 1],
    },
    // Weight by absolute interval in semitones from previous note (index = semitones).
    //               0  1  2   3  4  5  6  7  8  9  10 11 12
    intervalWeights: [0, 8, 10, 6, 6, 5, 2, 4, 2, 2, 1, 1, 2],
    beyondOctaveWeight: 0.15,
    // Unplayed pitch classes in the current key get weight * (1 + rate * notesInKey).
    unplayedBoostRate: 0.3,
    modes: ['major', 'minor'],
  },

  strobe: {
    segments: 16,
    farCents: 300, // at/after this distance color is full red
    degPerSecPerCent: 1.2, // rotation speed scale
    maxDegPerSec: 540,
  },

  checkMs: 700, // check mark fade duration; next note starts after
};
