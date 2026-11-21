import { useMemo, useState } from 'react';
import { CELL_PARTS, cellReason, type CellChoice, type CellPart } from '../../games/content';
import { seeded, shuffle } from '../../engine/rng';
import { play } from '../sounds';
import { GameEnd } from './GameEnd';

export interface GameProps {
  /** Called once per thing she decided, with her first try. */
  onAnswer: (id: string, correct: boolean) => void;
  /** Called when the game is finished. */
  onDone: (right: number, total: number) => void;
  onBack: () => void;
  seed?: number;
}

/**
 * Build a cell: each organelle chip goes into the animal cell, the plant cell, or both.
 * The two cells fill in as she places the parts. A wrong placement bounces back with the reason.
 */
export function BuildCell({ onAnswer, onDone, onBack, seed = Date.now() }: GameProps) {
  const order = useMemo(() => shuffle(CELL_PARTS, seeded(seed)), [seed]);
  const [i, setI] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);

  const part = order[i];
  const right = Object.values(firstTry).filter(Boolean).length;

  if (done) {
    const wrongOnes = order.filter((p) => firstTry[p.key] === false);
    const line = wrongOnes.length === 0
      ? 'Every organelle in the right cell first time. Plant cells have everything animal cells have, plus three more parts.'
      : `You moved ${wrongOnes.map((p) => p.name.toLowerCase()).join(', ')} on the second go. Remember: plant cells have all the animal parts too.`;
    return <GameEnd title="Cells built!" right={right} total={order.length} line={line} onAgain={() => { setI(0); setPlaced([]); setFirstTry({}); setMsg(null); setDone(false); }} onBack={onBack} />;
  }

  const choose = (c: CellChoice) => {
    if (msg?.ok) return;
    const ok = (part.where === 'both' && c === 'both') || (part.where === 'plant' && c === 'plant');
    if (!(part.key in firstTry)) {
      setFirstTry({ ...firstTry, [part.key]: ok });
      onAnswer(`game:cell:${part.key}`, ok);
    }
    if (ok) {
      play('correct');
      setPlaced([...placed, part.key]);
      setMsg({ ok: true, text: part.fact });
    } else {
      play('notyet');
      setShake(true);
      setTimeout(() => setShake(false), 450);
      setMsg({ ok: false, text: cellReason(part, c) });
    }
  };

  const next = () => {
    setMsg(null);
    if (i + 1 >= order.length) { setDone(true); onDone(right, order.length); } else setI(i + 1);
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label="Stop and go back">✕</button>
        <div className="progress" aria-label={`Part ${i + 1} of ${order.length}`}><div style={{ width: `${(i / order.length) * 100}%` }} /></div>
      </div>
      <h2>Build a cell</h2>
      <div className="cells">
        <figure className="cell-fig">
          <CellDrawing kind="animal" parts={placed} />
          <figcaption>Animal cell</figcaption>
        </figure>
        <figure className="cell-fig">
          <CellDrawing kind="plant" parts={placed} />
          <figcaption>Plant cell</figcaption>
        </figure>
      </div>

      <div className={`chip-card${shake ? ' shake' : ''}`}>
        <span className="chip-icon" aria-hidden="true"><PartIcon part={part.key} /></span>
        <b>{part.name}</b>
      </div>
      <p className="muted small center">Where does it belong?</p>
      <div className="row">
        <button className="btn ghost grow where" disabled={!!msg?.ok} onClick={() => choose('animal')}>Animal only</button>
        <button className="btn blue grow where" disabled={!!msg?.ok} onClick={() => choose('both')}>Both</button>
        <button className="btn grow where" disabled={!!msg?.ok} onClick={() => choose('plant')}>Plant only</button>
      </div>

      {msg && (
        <div className={`feedback ${msg.ok ? 'ok' : 'notyet'}`} role="status">
          <h2>{msg.ok ? 'Placed!' : 'It bounced out'}</h2>
          <p>{msg.text}</p>
          {msg.ok
            ? <button className="btn block big" onClick={next} autoFocus>{i + 1 >= order.length ? 'Finish' : 'Next part'}</button>
            : <button className="btn block big orange" onClick={() => setMsg(null)} autoFocus>Try again</button>}
        </div>
      )}
    </div>
  );
}

/** A simple cell that gains organelles as they are placed. */
function CellDrawing({ kind, parts }: { kind: 'animal' | 'plant'; parts: string[] }) {
  const has = (k: string) => parts.includes(k) && (kind === 'plant' || CELL_PARTS.find((p) => p.key === k)?.where === 'both');
  const plant = kind === 'plant';
  return (
    <svg viewBox="0 0 160 130" width="100%" role="img" aria-label={`${kind} cell with ${parts.filter(has).length} parts`}>
      {plant && has('wall') && <rect x="6" y="6" width="148" height="118" rx="10" fill="#c9f2a7" stroke="#46a302" strokeWidth="7" className="pop" />}
      {plant
        ? <rect x="14" y="14" width="132" height="102" rx="8" fill={has('cytoplasm') ? '#f3ffe9' : '#fff'} stroke={has('membrane') ? '#e08600' : '#ddd'} strokeWidth={has('membrane') ? 2.5 : 1.5} strokeDasharray={has('membrane') ? undefined : '4 3'} />
        : <path d="M20,65 C20,30 55,14 85,16 C120,18 142,40 140,66 C138,95 112,116 80,114 C48,112 20,98 20,65Z" fill={has('cytoplasm') ? '#fff4e0' : '#fff'} stroke={has('membrane') ? '#e08600' : '#ddd'} strokeWidth={has('membrane') ? 3 : 1.5} strokeDasharray={has('membrane') ? undefined : '4 3'} />}
      {plant && has('vacuole') && <rect x="40" y="36" width="78" height="52" rx="24" fill="#ddf4ff" stroke="#1cb0f6" strokeWidth="2.5" className="pop" />}
      {has('nucleus') && (plant
        ? <circle cx="124" cy="94" r="13" fill="#eadcff" stroke="#a568cc" strokeWidth="2.5" className="pop" />
        : <circle cx="78" cy="62" r="22" fill="#eadcff" stroke="#a568cc" strokeWidth="2.5" className="pop" />)}
      {has('nucleolus') && has('nucleus') && (plant
        ? <circle cx="121" cy="91" r="4" fill="#a568cc" className="pop" />
        : <circle cx="72" cy="56" r="7" fill="#a568cc" className="pop" />)}
      {has('mitochondria') && (
        <g className="pop">
          <ellipse cx={plant ? 40 : 118} cy={plant ? 104 : 42} rx="12" ry="6" fill="#ffc9bf" stroke="#e0604d" strokeWidth="2" transform={`rotate(-20 ${plant ? 40 : 118} ${plant ? 104 : 42})`} />
          <ellipse cx={plant ? 108 : 44} cy={plant ? 26 : 92} rx="12" ry="6" fill="#ffc9bf" stroke="#e0604d" strokeWidth="2" transform={`rotate(25 ${plant ? 108 : 44} ${plant ? 26 : 92})`} />
        </g>
      )}
      {has('ribosomes') && (
        <g className="pop" fill="#1899d6">
          {[[40, 40], [52, 100], [110, 100], [126, 60], [60, 30], [100, 36]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.2" />)}
        </g>
      )}
      {plant && has('chloroplasts') && (
        <g className="pop">
          {[[30, 30, -10], [130, 30, 15], [28, 80, 80], [84, 104, -5]].map(([x, y, r]) => (
            <ellipse key={`${x}${y}`} cx={x} cy={y} rx="9" ry="4.5" fill="#58cc02" stroke="#3d8c02" strokeWidth="1.5" transform={`rotate(${r} ${x} ${y})`} />
          ))}
        </g>
      )}
    </svg>
  );
}

function PartIcon({ part }: { part: string }) {
  switch (part) {
    case 'membrane': return <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#fff4e0" stroke="#e08600" strokeWidth="4" /></svg>;
    case 'wall': return <svg viewBox="0 0 40 40"><rect x="5" y="5" width="30" height="30" rx="5" fill="#c9f2a7" stroke="#46a302" strokeWidth="6" /></svg>;
    case 'cytoplasm': return <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#fff4e0" /><circle cx="14" cy="18" r="2" fill="#f0c070" /><circle cx="25" cy="25" r="2" fill="#f0c070" /><circle cx="24" cy="14" r="1.5" fill="#f0c070" /></svg>;
    case 'nucleus': return <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#eadcff" stroke="#a568cc" strokeWidth="3" /></svg>;
    case 'nucleolus': return <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#eadcff" stroke="#a568cc" strokeWidth="2" /><circle cx="18" cy="18" r="6" fill="#a568cc" /></svg>;
    case 'ribosomes': return <svg viewBox="0 0 40 40">{[[12, 12], [26, 10], [20, 22], [10, 28], [30, 28]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3.5" fill="#1899d6" />)}</svg>;
    case 'mitochondria': return <svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="16" ry="9" fill="#ffc9bf" stroke="#e0604d" strokeWidth="2.5" /><polyline points="8,20 11,15 14,25 17,15 20,25 23,15 26,25 29,15 32,20" fill="none" stroke="#e0604d" strokeWidth="1.6" /></svg>;
    case 'chloroplasts': return <svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="15" ry="8" fill="#58cc02" stroke="#3d8c02" strokeWidth="2" /><line x1="13" y1="17" x2="13" y2="23" stroke="#2f6e01" strokeWidth="2" /><line x1="20" y1="16" x2="20" y2="24" stroke="#2f6e01" strokeWidth="2" /><line x1="27" y1="17" x2="27" y2="23" stroke="#2f6e01" strokeWidth="2" /></svg>;
    case 'vacuole': return <svg viewBox="0 0 40 40"><rect x="5" y="9" width="30" height="22" rx="11" fill="#ddf4ff" stroke="#1cb0f6" strokeWidth="2.5" /></svg>;
    default: return null;
  }
}

export type { CellPart };
