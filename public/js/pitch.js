// YIN pitch detection (de Cheveigné & Kawahara 2002).
export function rms(buf) {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / buf.length);
}

export function detectPitch(buf, sampleRate, { minFreq = 120, maxFreq = 1100, threshold = 0.15, minRms = 0.01 } = {}) {
  if (rms(buf) < minRms) return null;
  const tauMin = Math.floor(sampleRate / maxFreq);
  const tauMax = Math.min(Math.ceil(sampleRate / minFreq), Math.floor(buf.length / 2));
  const W = buf.length - tauMax;
  const d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let s = 0;
    for (let i = 0; i < W; i++) {
      const x = buf[i] - buf[i + tau];
      s += x * x;
    }
    d[tau] = s;
  }
  // cumulative mean normalized difference
  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    running += d[tau];
    cmnd[tau] = running ? (d[tau] * tau) / running : 1;
  }
  let tau = -1;
  for (let t = Math.max(2, tauMin); t < tauMax; t++) {
    if (cmnd[t] < threshold) {
      while (t + 1 < tauMax && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) return null;
  // parabolic interpolation
  const a = cmnd[tau - 1], b = cmnd[tau], c = cmnd[tau + 1] ?? b;
  const denom = a - 2 * b + c;
  const shift = denom ? (a - c) / (2 * denom) : 0;
  const freq = sampleRate / (tau + shift);
  if (freq < minFreq || freq > maxFreq) return null;
  return { freq, clarity: 1 - b };
}
