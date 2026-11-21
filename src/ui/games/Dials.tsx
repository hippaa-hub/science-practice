import { useEffect, useMemo, useState } from 'react';
import { EYEPIECES, OBJECTIVES, TARGETS } from '../../games/content';
import { seeded, shuffle } from '../../engine/rng';
import { play } from '../sounds';
import type { GameProps } from './BuildCell';
import { GameEnd } from './GameEnd';

export const DIAL_ROUNDS = 6;

/**
 * Magnification dials: set the eyepiece and the objective so that eyepiece × objective = the target.
 * The specimen is blurry until the magnification is right, then it snaps sharp.
 */
export function Dials({ onAnswer, onDone, onBack, seed = Date.now() }: GameProps) {
  const targets = useMemo(() => shuffle(TARGETS, seeded(seed)).slice(0, DIAL_ROUNDS), [seed]);
  const [i, setI] = useState(0);
  const [eye, setEye] = useState(10);
  const [obj, setObj] = useState(4);
  const [firstTry, setFirstTry] = useState<Record<number, boolean>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [done]);

  const target = targets[i];
  const total = eye * obj;
  const right = Object.values(firstTry).filter(Boolean).length;

  if (done) {
    const line = right === targets.length
      ? `All ${targets.length} magnifications locked in first time, in ${seconds} seconds. Total = eyepiece × objective.`
      : `${right} of ${targets.length} locked in first time. Remember: total magnification = eyepiece × objective.`;
    return <GameEnd title="Dials done!" right={right} total={targets.length} line={line}
      onAgain={() => { setI(0); setFirstTry({}); setMsg(null); setSeconds(0); setDone(false); }} onBack={onBack} />;
  }

  const lock = () => {
    const ok = total === target;
    if (!(i in firstTry)) {
      setFirstTry({ ...firstTry, [i]: ok });
      onAnswer(`game:dials:${target}`, ok);
    }
    play(ok ? 'correct' : 'notyet');
    setMsg(ok
      ? { ok: true, text: `${eye} × ${obj} = ${target}×. Sharp!` }
      : { ok: false, text: `${eye} × ${obj} = ${total}×, not ${target}×. ${total > target ? 'Too strong: try a smaller lens.' : 'Too weak: try a bigger lens.'}` });
  };

  const next = () => {
    setMsg(null);
    if (i + 1 >= targets.length) { setDone(true); onDone(right, targets.length); } else setI(i + 1);
  };

  // How far off we are decides the blur: exactly right is sharp.
  const off = Math.abs(Math.log(total / target));
  const blur = Math.min(6, off * 6);

  return (
    <div className="screen">
      <div className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label="Stop and go back">✕</button>
        <div className="progress" aria-label={`Target ${i + 1} of ${targets.length}`}><div style={{ width: `${(i / targets.length) * 100}%` }} /></div>
        <span className="small muted">{seconds}s</span>
      </div>
      <h2>Magnification dials</h2>
      <div className="card blue center">
        <p className="small label muted">Target</p>
        <p className="target">{target}×</p>
      </div>

      <div className="scope-view" aria-label={`Specimen at ${total} times`}>
        <svg viewBox="0 0 200 120" width="100%">
          <rect width="200" height="120" fill="#eef9ff" />
          <g style={{ filter: `blur(${blur}px)` }} transform={`translate(100 60) scale(${Math.max(0.25, Math.min(3, target / 160))}) translate(-100 -60)`}>
            {[[70, 50], [120, 44], [95, 80], [140, 78]].map(([x, y]) => (
              <g key={`${x}${y}`}><ellipse cx={x} cy={y} rx="18" ry="14" fill="#ffe0ee" stroke="#e66a9a" strokeWidth="2" /><circle cx={x - 2} cy={y} r="5" fill="#5a6fd8" /></g>
            ))}
          </g>
        </svg>
        <span className="scope-total">{eye} × {obj} = <b>{total}×</b></span>
      </div>

      <Dial label="Eyepiece" values={EYEPIECES} value={eye} onChange={setEye} disabled={!!msg?.ok} />
      <Dial label="Objective" values={OBJECTIVES} value={obj} onChange={setObj} disabled={!!msg?.ok} />

      <button className="btn block big" disabled={!!msg?.ok} onClick={lock}>Lock in</button>

      {msg && (
        <div className={`feedback ${msg.ok ? 'ok' : 'notyet'}`} role="status">
          <h2>{msg.ok ? 'Locked in!' : 'Not yet'}</h2>
          <p>{msg.text}</p>
          {msg.ok
            ? <button className="btn block big" onClick={next} autoFocus>{i + 1 >= targets.length ? 'Finish' : 'Next target'}</button>
            : <button className="btn block big orange" onClick={() => setMsg(null)} autoFocus>Turn the dials</button>}
        </div>
      )}
    </div>
  );
}

function Dial({ label, values, value, onChange, disabled }: { label: string; values: number[]; value: number; onChange: (v: number) => void; disabled: boolean }) {
  const idx = values.indexOf(value);
  const angle = -40 + idx * 40;
  return (
    <div className="dial-row">
      <div className="dial" aria-hidden="true"><i style={{ transform: `rotate(${angle}deg)` }} /></div>
      <div className="grow">
        <p className="small label muted">{label}</p>
        <div className="row" role="radiogroup" aria-label={label}>
          {values.map((v) => (
            <button key={v} role="radio" aria-checked={v === value} disabled={disabled}
              className={`bin grow${v === value ? ' selected' : ''}`} onClick={() => onChange(v)}>{v}×</button>
          ))}
        </div>
      </div>
    </div>
  );
}
