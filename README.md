# earflash

Minimal mobile web app for relative-pitch ear training on Bb clarinet.

Tap to start (a play/pause icon sits at the center). The app plays a hidden note (concert D3 to Bb5, the clarinet's written E3 to C6 range). Match it on your clarinet in the same octave. A strobe ring shows how close you are: red when far off, green when in tune, and it stands still at the target pitch. Hold the pitch within ±50 cents (half a semitone) for 0.3 s and a check mark appears, then the next note plays. Hold a wrong note (at least 75 cents off, or the wrong octave) steadily for 0.3 s and a red X appears. The app then goes back to the previous note, and once you match that, it returns to the note you missed, so you practice the interval and fingering change. A note still sounding from the last match or miss is ignored until you stop or change it. Tap again to stop.

Notes come from a hidden random key (major or natural minor), weighted toward diatonic notes and small intervals. After all 12 pitch classes have been played, the app picks a new key.

## Run locally

```
npm run serve   # http://localhost:8642 (mic needs localhost or HTTPS)
npm test
```

No dependencies and no build step.

## Tuning

All tunables live in `public/js/config.js`: range, match tolerance and hold time, wrong-note threshold and hold time, detection thresholds, tone envelope and partials, note-selection weights, and strobe behavior.

## Deploy (Azure Static Web Apps)

Deploy the `public/` folder as-is (`app_location: public`, no build command, no API).

## Known limitation

Without headphones, the speaker tone can leak into the mic. The app currently relies only on browser echo cancellation (`echoCancellation: true`). How well that works varies by browser and device.
