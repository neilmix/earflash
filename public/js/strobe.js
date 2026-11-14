import { proximityHue } from './color.js';

export function createStrobe(canvas, strobeCfg, toleranceCents) {
  const g = canvas.getContext('2d');
  let angle = 0;
  let last = null;
  const colorOpts = { toleranceCents, farCents: strobeCfg.farCents };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  }
  window.addEventListener('resize', resize);
  resize();

  return {
    // cents: offset of input from target (null = no pitch); level: 0..1 signal strength
    draw(cents, level, now) {
      const dt = last == null ? 0 : (now - last) / 1000;
      last = now;
      const { width: w, height: h } = canvas;
      g.clearRect(0, 0, w, h);
      const r = Math.min(w, h) * 0.34;
      const thick = r * 0.28;
      let fill;
      if (cents == null) {
        fill = 'hsla(0, 0%, 60%, 0.18)';
      } else {
        const v = Math.max(-strobeCfg.maxDegPerSec, Math.min(strobeCfg.maxDegPerSec, cents * strobeCfg.degPerSecPerCent));
        angle = (angle + v * dt) % 360;
        const alpha = 0.35 + 0.65 * Math.min(1, level);
        fill = `hsla(${proximityHue(cents, colorOpts)}, 75%, 45%, ${alpha})`;
      }
      g.save();
      g.translate(w / 2, h / 2);
      g.rotate((angle * Math.PI) / 180);
      g.fillStyle = fill;
      const n = strobeCfg.segments;
      const step = (2 * Math.PI) / n;
      for (let i = 0; i < n; i += 2) {
        g.beginPath();
        g.arc(0, 0, r + thick / 2, i * step, (i + 1) * step);
        g.arc(0, 0, r - thick / 2, (i + 1) * step, i * step, true);
        g.closePath();
        g.fill();
      }
      g.restore();
    },
    clear() {
      last = null;
      g.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
