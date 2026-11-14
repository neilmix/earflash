// Bell-like repeating tone: soft attack, harmonic partials that decay (upper ones faster).
export function createBellPlayer(ctx, destination, tone) {
  let timer = null;
  let nextTime = 0;
  let freq = 0;
  let voices = [];

  function scheduleBell(when) {
    const out = ctx.createGain();
    out.gain.value = tone.gain;
    out.connect(destination);
    const end = when + tone.decaySec + 0.05;
    for (const [ratio, amp, decayMult] of tone.partials) {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq * ratio;
      const g = ctx.createGain();
      const peak = when + tone.attackSec;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(amp, peak);
      g.gain.setTargetAtTime(0, peak, (tone.decaySec - tone.attackSec) / (4 * decayMult));
      osc.connect(g).connect(out);
      osc.start(when);
      osc.stop(end);
    }
    const v = { out, end };
    voices.push(v);
    voices = voices.filter(x => x.end > ctx.currentTime);
  }

  function tick() {
    while (nextTime < ctx.currentTime + 0.2) {
      scheduleBell(nextTime);
      nextTime += tone.periodSec;
    }
  }

  return {
    play(f) {
      this.stop();
      freq = f;
      nextTime = ctx.currentTime + 0.05;
      tick();
      timer = setInterval(tick, 50);
    },
    stop() {
      clearInterval(timer);
      timer = null;
      const t = ctx.currentTime;
      for (const v of voices) {
        v.out.gain.cancelScheduledValues(t);
        v.out.gain.setValueAtTime(v.out.gain.value, t);
        v.out.gain.linearRampToValueAtTime(0, t + tone.stopFadeSec);
        setTimeout(() => v.out.disconnect(), (tone.stopFadeSec + 0.1) * 1000);
      }
      voices = [];
    },
  };
}
