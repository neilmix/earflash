# earflash

Static, dependency-free web app (ES modules, no build). Spec summary in README.md.

## Layout
- `public/`: deployable site (Azure Static Web Apps, app_location `public`)
  - `js/config.js`: every tunable; change behavior here first
  - `js/notes.js`, `selector.js`, `pitch.js` (YIN), `matcher.js`, `wrong.js` (wrong-note detection), `sequence.js` (rewind order), `color.js`: pure logic, unit tested
  - `js/synth.js` (bell tone), `strobe.js` (canvas), `main.js` (wiring/state): browser-only
- `test/`: `node:test` unit tests (`npm test`)

## Product rules (from the user)
- Minimalist: no text, note names, notation, or other pitch hints anywhere in the UI.
- Add only requested features.
- Speaker use without headphones must work. Echo cancellation is the current approach; the user has follow-up ideas if it fails.

## Testing
- `npm test` for logic.
- Browser: `npm run serve`, then use agent-browser. Before tapping, override `navigator.mediaDevices.getUserMedia` via `eval` to return a `MediaStreamDestination` stream from an oscillator that follows `window.__earflash.target` (a test-only hook). To test a miss, shift the oscillator off target (e.g. +3 semitones) for over 0.3 s. Tap with `agent-browser click body`.
