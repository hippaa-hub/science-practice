import { useEffect, useMemo, useState } from 'react';
import { PREDICTIONS, type Prediction } from '../../games/content';
import { seeded, shuffle } from '../../engine/rng';
import { play } from '../sounds';
import type { GameProps } from './BuildCell';
import { GameEnd } from './GameEnd';

export const PREDICT_ROUNDS = 5;

/**
 * Predict it!: read the situation, pick a prediction, watch what happens, then pick the explanation.
 * The prediction is what counts for the score; the explanation step is where the learning sticks.
 */
export function Predict({ onAnswer, onDone, onBack, seed = Date.now() }: GameProps) {
  const rounds = useMemo(() => shuffle(PREDICTIONS, seeded(seed)).slice(0, PREDICT_ROUNDS), [seed]);
  const [i, setI] = useState(0);
  const [stage, setStage] = useState<'predict' | 'watch' | 'why' | 'result'>('predict');
  const [picked, setPicked] = useState<string | null>(null);
  const [whyPicked, setWhyPicked] = useState<string | null>(null);
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  const p = rounds[i];
  const options = useMemo(() => shuffle(p.options, seeded(seed + i)), [p, seed, i]);
  const whyOptions = useMemo(() => shuffle(p.whyOptions, seeded(seed + i + 99)), [p, seed, i]);
  const right = Object.values(firstTry).filter(Boolean).length;

  useEffect(() => {
    if (stage !== 'watch') return;
    const t = setTimeout(() => setStage('why'), 2800);
    return () => clearTimeout(t);
  }, [stage]);

  if (done) {
    const line = right === rounds.length
      ? 'Every prediction right. Predicting first, then watching, is how scientists think.'
      : `${right} of ${rounds.length} predictions right. A wrong prediction is useful: now you know why it happens.`;
    return <GameEnd title="Predictions done!" right={right} total={rounds.length} line={line}
      onAgain={() => { setI(0); setStage('predict'); setPicked(null); setWhyPicked(null); setFirstTry({}); setDone(false); }} onBack={onBack} />;
  }

  const predict = () => {
    if (!picked) return;
    const ok = picked === p.answer;
    setFirstTry({ ...firstTry, [p.id]: ok });
    onAnswer(`game:predict:${p.id}`, ok);
    setStage('watch');
  };

  const explain = () => {
    if (!whyPicked) return;
    play(whyPicked === p.why ? 'correct' : 'notyet');
    setStage('result');
  };

  const next = () => {
    setPicked(null); setWhyPicked(null); setStage('predict');
    if (i + 1 >= rounds.length) { setDone(true); onDone(right, rounds.length); } else setI(i + 1);
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label="Stop and go back">✕</button>
        <div className="progress" aria-label={`Prediction ${i + 1} of ${rounds.length}`}><div style={{ width: `${(i / rounds.length) * 100}%` }} /></div>
      </div>
      <p className="chip learning">{stage === 'predict' ? '1 · Predict' : stage === 'watch' ? '2 · Watch' : '3 · Explain'}</p>
      <p className="learn-text">{p.situation}</p>
      <Scene p={p} playing={stage !== 'predict'} />

      {stage === 'predict' && (
        <>
          <p className="qtext">{p.question}</p>
          <div className="choices">
            {options.map((o) => <button key={o} className={`choice${picked === o ? ' selected' : ''}`} onClick={() => setPicked(o)}>{o}</button>)}
          </div>
          <button className="btn block big blue" disabled={!picked} onClick={predict}>Predict!</button>
        </>
      )}

      {stage === 'watch' && <p className="center bold pulse-text">Watch…</p>}

      {(stage === 'why' || stage === 'result') && (
        <>
          <div className={`card ${firstTry[p.id] ? 'green' : 'orange'}`}>
            <p className="small label muted">What happened</p>
            <p className="bold">{p.observed}</p>
            <p className="small">{firstTry[p.id] ? 'Your prediction was right.' : `You predicted "${picked}". Not this time, and now you have seen why.`}</p>
          </div>
          <p className="qtext">Why?</p>
          <div className="choices">
            {whyOptions.map((o) => (
              <button key={o} disabled={stage === 'result'}
                className={`choice${whyPicked === o ? ' selected' : ''}${stage === 'result' && o === p.why ? ' right' : ''}`}
                onClick={() => setWhyPicked(o)}>{o}</button>
            ))}
          </div>
          {stage === 'why' && <button className="btn block big" disabled={!whyPicked} onClick={explain}>Check</button>}
          {stage === 'result' && (
            <div className={`feedback ${whyPicked === p.why ? 'ok' : 'learn'}`} role="status">
              <h2>{whyPicked === p.why ? 'Yes, that is why.' : 'The reason is:'}</h2>
              <p>{p.why}.</p>
              <button className="btn block big" onClick={next} autoFocus>{i + 1 >= rounds.length ? 'Finish' : 'Next prediction'}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** The small animated scene for each prediction. `playing` starts the animation (CSS). */
function Scene({ p, playing }: { p: Prediction; playing: boolean }) {
  const cls = `scene${playing ? ' playing' : ''}`;
  switch (p.scene) {
    case 'ice':
      return (
        <svg className={cls} viewBox="0 0 320 140" role="img" aria-label="Two ice cubes on a metal plate and a wooden plate">
          <rect x="30" y="100" width="110" height="14" rx="4" fill="#9aa4ad" />
          <rect x="180" y="100" width="110" height="14" rx="4" fill="#b07a45" />
          <text x="85" y="132" textAnchor="middle" fontSize="13" fontWeight="800" fill="#555">metal</text>
          <text x="235" y="132" textAnchor="middle" fontSize="13" fontWeight="800" fill="#555">wood</text>
          <g className="melt-fast" style={{ transformOrigin: '85px 100px' }}><rect x="60" y="50" width="50" height="50" rx="8" fill="#dff3ff" stroke="#8fd3ff" strokeWidth="3" /></g>
          <g className="melt-slow" style={{ transformOrigin: '235px 100px' }}><rect x="210" y="50" width="50" height="50" rx="8" fill="#dff3ff" stroke="#8fd3ff" strokeWidth="3" /></g>
          <ellipse className="puddle" cx="85" cy="100" rx="40" ry="5" fill="#bfe6ff" />
        </svg>
      );
    case 'slide':
      return (
        <svg className={cls} viewBox="0 0 320 140" role="img" aria-label="A microscope view of a cell">
          <circle cx="160" cy="70" r="60" fill="#eef9ff" stroke="#333" strokeWidth="4" />
          <clipPath id="view-clip"><circle cx="160" cy="70" r="58" /></clipPath>
          <g clipPath="url(#view-clip)">
            <g className="move-left"><ellipse cx="160" cy="70" rx="26" ry="20" fill="#ffe0ee" stroke="#e66a9a" strokeWidth="3" /><circle cx="156" cy="68" r="7" fill="#5a6fd8" /></g>
          </g>
          <g className="move-right"><rect x="20" y="118" width="60" height="10" rx="3" fill="#bfe6ff" stroke="#1cb0f6" strokeWidth="2" /><text x="50" y="112" textAnchor="middle" fontSize="11" fontWeight="800" fill="#555">slide →</text></g>
        </svg>
      );
    case 'objective':
      return (
        <svg className={cls} viewBox="0 0 320 140" role="img" aria-label="A cell growing bigger in the microscope view">
          <circle cx="160" cy="70" r="60" fill="#eef9ff" stroke="#333" strokeWidth="4" />
          <clipPath id="obj-clip"><circle cx="160" cy="70" r="58" /></clipPath>
          <g clipPath="url(#obj-clip)">
            <g className="grow4" style={{ transformOrigin: '160px 70px' }}><ellipse cx="160" cy="70" rx="12" ry="9" fill="#ffe0ee" stroke="#e66a9a" strokeWidth="2" /><circle cx="158" cy="69" r="3" fill="#5a6fd8" /></g>
          </g>
          <text x="40" y="30" fontSize="14" fontWeight="800" fill="#555" className="fade-swap"><tspan>10 × 10 = 100×</tspan></text>
          <text x="40" y="30" fontSize="14" fontWeight="800" fill="#1899d6" className="fade-in-late">10 × 40 = 400×</text>
        </svg>
      );
    case 'vacuole':
      return (
        <svg className={cls} viewBox="0 0 320 140" role="img" aria-label="A plant cell losing water and a leaf drooping">
          <rect x="20" y="20" width="120" height="100" rx="10" fill="#e3fbd0" stroke="#46a302" strokeWidth="6" />
          <g className="vac-shrink" style={{ transformOrigin: '80px 70px' }}><rect x="40" y="40" width="80" height="60" rx="26" fill="#ddf4ff" stroke="#1cb0f6" strokeWidth="3" /></g>
          <g className="droop" style={{ transformOrigin: '200px 120px' }}>
            <path d="M200,120 C205,80 235,55 280,40 C275,75 250,100 200,120Z" fill="#58cc02" stroke="#3d8c02" strokeWidth="3" />
            <line x1="200" y1="120" x2="268" y2="50" stroke="#3d8c02" strokeWidth="2" />
          </g>
        </svg>
      );
    case 'beta':
      return (
        <svg className={cls} viewBox="0 0 320 140" role="img" aria-label="Beta-cells releasing insulin, then fading away">
          <rect x="200" y="20" width="40" height="100" rx="12" fill="#ffd6d6" stroke="#d94848" strokeWidth="3" />
          <text x="220" y="135" textAnchor="middle" fontSize="11" fontWeight="800" fill="#555">blood</text>
          <g className="cells-fade">
            {[[60, 50], [100, 45], [80, 85], [120, 90]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="18" fill="#fff4e0" stroke="#e08600" strokeWidth="3" />)}
          </g>
          <g className="insulin-stop">{[[150, 50], [165, 70], [152, 92]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill="#1cb0f6" />)}</g>
          <text className="fade-in-late" x="90" y="130" textAnchor="middle" fontSize="12" fontWeight="800" fill="#d94848">no beta-cells → no insulin</text>
        </svg>
      );
    case 'kettle':
      return (
        <svg className={cls} viewBox="0 0 320 140" role="img" aria-label="A Sankey arrow: 500 joules in, 400 useful, 100 wasted">
          <text x="14" y="30" fontSize="13" fontWeight="800" fill="#555">500 J in</text>
          <rect x="14" y="40" width="120" height="50" fill="#ffc800" />
          <g className="sankey-useful" style={{ transformOrigin: '134px 60px' }}><path d="M134,40 L270,40 L300,60 L270,80 L134,80Z" fill="#58cc02" /></g>
          <g className="sankey-waste" style={{ transformOrigin: '134px 85px' }}><path d="M134,80 L134,90 L190,120 L190,130 L230,112 L190,96 L190,104 Z" fill="#ff9600" /></g>
          <text className="fade-in-late" x="300" y="34" textAnchor="end" fontSize="13" fontWeight="800" fill="#46a302">400 J useful</text>
          <text className="fade-in-late" x="240" y="135" fontSize="13" fontWeight="800" fill="#e08600">100 J wasted</text>
        </svg>
      );
    case 'toaster':
      return (
        <svg className={cls} viewBox="0 0 320 140" role="img" aria-label="Warm air rising from a toaster to hands above it">
          <rect x="110" y="90" width="100" height="40" rx="8" fill="#9aa4ad" />
          <rect x="125" y="84" width="25" height="8" fill="#ff6b35" /><rect x="170" y="84" width="25" height="8" fill="#ff6b35" />
          {[0, 1, 2].map((k) => (
            <path key={k} className="air-rise" style={{ animationDelay: `${k * 0.6}s` }} d={`M${135 + k * 25},84 q6,-10 0,-20 q-6,-10 0,-20`} fill="none" stroke="#ff9600" strokeWidth="3" strokeLinecap="round" />
          ))}
          <g className="hand-warm"><ellipse cx="160" cy="24" rx="40" ry="14" fill="#ffe0c2" stroke="#d99a5e" strokeWidth="2" /></g>
        </svg>
      );
    case 'cork':
      return (
        <svg className={cls} viewBox="0 0 320 140" role="img" aria-label="A microscope view of cork, empty boxes appearing">
          <circle cx="160" cy="70" r="60" fill="#f5e6cf" stroke="#333" strokeWidth="4" />
          <clipPath id="cork-clip2"><circle cx="160" cy="70" r="58" /></clipPath>
          <g clipPath="url(#cork-clip2)" className="boxes-appear" stroke="#a0784a" strokeWidth="2.5" fill="none">
            {Array.from({ length: 6 }, (_, r) => Array.from({ length: 8 }, (_, c) => (
              <rect key={`${r}-${c}`} x={95 + c * 18 + (r % 2) * 9} y={8 + r * 21} width="16" height="19" rx="2" />
            )))}
          </g>
        </svg>
      );
  }
}
