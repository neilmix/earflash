import { CONFIG } from './config.js';
import { midiToFreq } from './notes.js';
import { createSelector } from './selector.js';
import { detectPitch, rms } from './pitch.js';
import { createMatcher } from './matcher.js';
import { createBellPlayer } from './synth.js';
import { createStrobe } from './strobe.js';

const canvas = document.getElementById('strobe');
const check = document.getElementById('check');
const strobe = createStrobe(canvas, CONFIG.strobe, CONFIG.match.toleranceCents);
const selector = createSelector({ config: CONFIG });
const matcher = createMatcher(CONFIG.match);

let ctx, analyser, bell, buf, wakeLock;
let running = false;
let target = null; // Hz; null while showing the check
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

function nextNote() {
  document.body.classList.remove('checking');
  target = midiToFreq(selector.next());
  matcher.reset();
  bell.play(target);
}

function loop(now) {
  raf = requestAnimationFrame(loop);
  if (target == null) return;
  analyser.getFloatTimeDomainData(buf);
  const d = CONFIG.detection;
  const p = detectPitch(buf, ctx.sampleRate, { minFreq: d.minFreq, maxFreq: d.maxFreq, threshold: d.yinThreshold, minRms: d.minRms });
  const { cents, matched } = matcher.update(p?.freq ?? null, target, now);
  strobe.draw(cents, rms(buf) * 8, now);
  if (matched) {
    target = null;
    bell.stop();
    strobe.clear();
    document.body.classList.add('checking');
    // WAAPI, not a CSS class toggle: SVG has no offsetWidth, so the reflow trick can't restart a CSS animation.
    check.animate(
      [
        { opacity: 1, transform: 'translate(-50%, -50%) scale(0.92)' },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.25 },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(1)' },
      ],
      { duration: CONFIG.checkMs, easing: 'ease-out' },
    );
    nextTimer = setTimeout(() => { if (running) nextNote(); }, CONFIG.checkMs);
  }
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
  nextNote();
  raf = requestAnimationFrame(loop);
}

function stop() {
  running = false;
  document.body.classList.remove('running', 'checking');
  target = null;
  clearTimeout(nextTimer);
  cancelAnimationFrame(raf);
  bell?.stop();
  strobe.clear();
  check.getAnimations().forEach(a => a.cancel());
  wakeLock?.release();
  wakeLock = null;
}

document.addEventListener('click', () => (running ? stop() : start()));

// Hooks for automated testing only; nothing here is rendered.
window.__earflash = { get target() { return target; }, get running() { return running; }, selector };
