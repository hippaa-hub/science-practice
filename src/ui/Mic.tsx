import { useEffect, useRef, useState } from 'react';

/* Minimal typing for the browser's speech recognition (Chrome/Android, Safari/iPhone). */
interface SRResultList { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } }
interface SREvent { resultIndex: number; results: SRResultList }
interface SR {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type SRCtor = new () => SR;

function getCtor(): SRCtor | null {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canDictate(): boolean {
  return typeof window !== 'undefined' && !!getCtor();
}

/**
 * "Say it" button: she talks, the words appear in the answer box, and she can still edit them.
 * `base` is what was already typed; `onText` gets base + what she said so far.
 * Where the browser has no speech recognition, it shows a tip to use the keyboard's microphone instead.
 */
export function Mic({ base, onText, mode = 'append' }: { base: string; onText: (t: string) => void; mode?: 'append' | 'replace' }) {
  const [on, setOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<SR | null>(null);
  const start = useRef('');

  useEffect(() => () => rec.current?.abort(), []);

  if (!canDictate()) {
    return <p className="small muted mic-tip">Tip: to talk instead of typing, tap the 🎤 on your keyboard.</p>;
  }

  const join = (said: string) => {
    const s = said.trim();
    if (mode === 'replace') return s.replace(/[.!?]$/, '');
    if (!start.current.trim()) return s.charAt(0).toUpperCase() + s.slice(1);
    return `${start.current.replace(/\s+$/, '')} ${s}`;
  };

  const toggle = () => {
    if (on) { rec.current?.stop(); return; }
    const Ctor = getCtor()!;
    const r = new Ctor();
    r.lang = 'en-GB';
    r.continuous = mode === 'append';
    r.interimResults = true;
    start.current = base;
    let finalText = '';
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += `${t} `; else interim += t;
      }
      onText(join(finalText + interim));
    };
    r.onerror = (e) => {
      setError(e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? 'The microphone is blocked. Allow it in your browser settings, or use the 🎤 on your keyboard.'
        : e.error === 'no-speech' ? "I didn't hear anything. Tap and try again." : null);
    };
    r.onend = () => { setOn(false); rec.current = null; };
    rec.current = r;
    setError(null);
    setOn(true);
    r.start();
  };

  return (
    <div className="stack tight">
      <button type="button" className={`btn block mic${on ? ' on' : ''}`} onClick={toggle} aria-pressed={on}>
        <span aria-hidden="true">{on ? '⏹' : '🎤'}</span>{on ? 'Listening… tap to stop' : 'Say it instead'}
      </button>
      {error && <p className="small hint" role="status">{error}</p>}
    </div>
  );
}
