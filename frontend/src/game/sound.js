// Web Audio API beeps — mimic the Chrome dino jump/die/point sounds.
// No external assets: generated procedurally.

class SoundManager {
  constructor() {
    this.muted = false;
    this._ctx = null;
  }

  _ensureCtx() {
    if (!this._ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this._ctx = new Ctx();
    }
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }
    return this._ctx;
  }

  _beep(freq, durMs, type = 'square', gain = 0.08) {
    if (this.muted) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
    osc.start(now);
    osc.stop(now + durMs / 1000);
  }

  jump()    { this._beep(780, 80,  'square', 0.05); }
  point()   { this._beep(1300, 120, 'triangle', 0.06); }
  die()     {
    this._beep(220, 160, 'sawtooth', 0.08);
    setTimeout(() => this._beep(110, 260, 'sawtooth', 0.08), 120);
  }

  setMuted(flag) { this.muted = !!flag; }
}

export const sounds = new SoundManager();
