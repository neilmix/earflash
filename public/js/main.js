import { CONFIG } from './config.js';
import { midiToFreq } from './notes.js';
import { createSelector } from './selector.js';
import { detectPitch, rms } from './pitch.js';
import { createMatcher } from './matcher.js';
import { createWrongDetector } from './wrong.js';
import { createSequence } from './sequence.js';
import { createBellPlayer } from './synth.js';
import { createStrobe } from './strobe.js';

const canvas = document.getElementById('strobe');
const check = document.getElementById('check');
const fail = document.getElementById('fail');
const strobe = createStrobe(canvas, CONFIG.strobe, CONFIG.match.toleranceCents);
const selector = createSelector({ config: CONFIG });
const sequence = createSequence(selector);
const matcher = createMatcher(CONFIG.match);
const wrong = createWrongDetector(CONFIG.wrong);

let ctx, analyser, bell, buf, wakeLock;
let running = false;
let target = null; // Hz; null while showing check/fail
let raf = 0;
let nextTimer = 0;

async function setup() {
  ctx = new AudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
  });
  const src = ctx.createMediaStreamSource(stream);
  analyser = ctx.createAnalyser();
  analyser.fftSize = CONFIG.detection.fftSize;
  src.connect(analyser);
  buf = new Float32Array(analyser.fftSize);
  bell = createBellPlayer(ctx, ctx.destination, CONFIG.tone);
}

function playNote(midi) {
  document.body.classList.remove('feedback');
  target = midiToFreq(midi);
  matcher.reset();
  wrong.reset();
  bell.play(target);
}

// Shows a mark, then plays the next note. The pitch still sounding is exempt
// from wrong-note detection until it stops or changes.
function feedback(mark, keyframes, ms, freq, next) {
  target = null;
  bell.stop();
  strobe.clear();
  wrong.ignore(freq);
  document.body.classList.add('feedback');
  // WAAPI, not a CSS class toggle: SVG has no offsetWidth, so the reflow trick can't restart a CSS animation.
  mark.animate(keyframes, { duration: ms, easing: 'ease-out' });
  nextTimer = setTimeout(() => { if (running) playNote(next()); }, ms);
}

const CHECK_FRAMES = [
  { opacity: 1, transform: 'translate(-50%, -50%) scale(0.92)' },
  { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.25 },
  { opacity: 0, transform: 'translate(-50%, -50%) scale(1)' },
];
const FAIL_FRAMES = [{ opacity: 1 }, { opacity: 0 }];

function loop(now) {
  raf = requestAnimationFrame(loop);
  if (target == null) return;
  analyser.getFloatTimeDomainData(buf);
  const d = CONFIG.detection;
  const p = detectPitch(buf, ctx.sampleRate, { minFreq: d.minFreq, maxFreq: d.maxFreq, threshold: d.yinThreshold, minRms: d.minRms });
  const freq = p?.freq ?? null;
  const { cents, matched } = matcher.update(freq, target, now);
  const failed = !matched && wrong.update(freq, target, now);
  strobe.draw(cents, rms(buf) * 8, now);
  if (matched) feedback(check, CHECK_FRAMES, CONFIG.checkMs, freq, sequence.matched);
  else if (failed) feedback(fail, FAIL_FRAMES, CONFIG.failMs, freq, sequence.failed);
}

async function start() {
  running = true;
  document.body.classList.add('running');
  if (!ctx) {
    try {
      await setup();
    } catch (e) {
      console.error(e);
      running = false;
      document.body.classList.remove('running');
      return;
    }
  }
  await ctx.resume();
  if (!running) return;
  wakeLock = await navigator.wakeLock?.request('screen').catch(() => null);
  playNote(sequence.start());
  raf = requestAnimationFrame(loop);
}

function stop() {
  running = false;
  document.body.classList.remove('running', 'feedback');
  target = null;
  clearTimeout(nextTimer);
  cancelAnimationFrame(raf);
  bell?.stop();
  strobe.clear();
  [check, fail].forEach(m => m.getAnimations().forEach(a => a.cancel()));
  wakeLock?.release();
  wakeLock = null;
}

document.addEventListener('click', () => (running ? stop() : start()));

// Hooks for automated testing only; nothing here is rendered.
window.__earflash = { get target() { return target; }, get running() { return running; }, selector };
