/** Tiny sound effects made with the Web Audio API: no files to download, works offline. */
type SoundName = 'correct' | 'notyet' | 'done' | 'tap' | 'badge';

let muted = false;
let ctx: AudioContext | null = null;

export function setMuted(m: boolean) { muted = m; }
export function isMuted() { return muted; }

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(c: AudioContext, freq: number, start: number, length: number, type: OscillatorType = 'sine', gain = 0.12) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + length);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + length + 0.05);
}

export function play(name: SoundName) {
  if (muted) return;
  try {
    const c = context();
    if (!c) return;
    switch (name) {
      case 'correct': tone(c, 660, 0, 0.12); tone(c, 880, 0.1, 0.18); break;
      case 'notyet': tone(c, 330, 0, 0.25, 'triangle', 0.08); break;
      case 'tap': tone(c, 520, 0, 0.05, 'square', 0.03); break;
      case 'done': [523, 659, 784, 1047].forEach((f, i) => tone(c, f, i * 0.12, 0.25)); break;
      case 'badge': [784, 988, 1175].forEach((f, i) => tone(c, f, i * 0.1, 0.3, 'triangle')); break;
    }
  } catch {
    // Sound is optional: never let it break the app.
  }
}
