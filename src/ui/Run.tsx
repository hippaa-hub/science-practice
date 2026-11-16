import { useEffect, useMemo, useRef, useState } from 'react';
import type { Item } from '../content/types';
import { answer, current, type SessionState } from '../engine/session';
import { ItemView, dontKnowOutcome, type Outcome } from './ItemView';
import { Photo } from './Photo';
import { Badges } from './Badges';
import { Mascot } from './Mascot';
import { play } from './sounds';

/** Plays a list of questions (Daily Mix, topic practice, or the check after Learn cards). */
export function Run({ items, session, onAnswer, onQuit }: {
  items: Item[];
  session: SessionState;
  onAnswer: (item: Item, o: Outcome, next: SessionState, firstTry: boolean) => void;
  onQuit: () => void;
}) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const entry = current(session)!;
  const item = items.find((i) => i.id === entry.id)!;
  const total = session.queue.length;
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!outcome) return;
    panel.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
    play(outcome.correct ? 'correct' : outcome.dontKnow ? 'tap' : 'notyet');
  }, [outcome]);

  const next = () => {
    if (!outcome) return;
    const r = answer(session, outcome.correct);
    setOutcome(null);
    onAnswer(item, outcome, r.state, r.firstTry);
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button className="iconbtn" onClick={onQuit} aria-label="Stop and go back">✕</button>
        <div className="progress" aria-label={`Question ${session.index + 1} of ${total}`}><div style={{ width: `${(session.index / total) * 100}%` }} /></div>
      </div>
      {entry.repeat && <p className="chip learning">One more try</p>}
      <fieldset className="plain" disabled={!!outcome} key={`${entry.id}-${session.index}`} data-item={entry.id}>
        <ItemView item={item} seed={entry.seed} onDone={setOutcome} />
      </fieldset>
      {!outcome && (
        <button className="btn ghost block dont-know" onClick={() => setOutcome(dontKnowOutcome(item, entry.seed))}>I don't know: show me</button>
      )}
      {outcome && (
        <div ref={panel} className={`feedback ${outcome.correct ? 'ok' : outcome.dontKnow ? 'learn' : 'notyet'}`} role="status">
          <h2>{outcome.correct ? 'Yes! Correct.' : outcome.dontKnow ? "Let's learn it" : 'Not yet'}</h2>
          {outcome.note && <p className="bold">{outcome.note}</p>}
          {!outcome.correct && outcome.reveal && <p className="pre"><b>{outcome.dontKnow && item.type === 'short' ? 'A good answer:' : 'Answer:'}</b> {outcome.reveal}</p>}
          {outcome.steps && !outcome.correct && <ol className="steps-list">{outcome.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
          <p>{item.explain}</p>
          {item.photo && <Photo name={item.photo} />}
          {!outcome.correct && !entry.repeat && <p className="small muted">{outcome.dontKnow ? 'Good choice to ask. This one comes back at the end, so you can try it yourself.' : 'This one will come back at the end and again tomorrow.'}</p>}
          <button className={`btn block big ${outcome.correct ? '' : outcome.dontKnow ? 'blue' : 'orange'}`} onClick={next} autoFocus>Continue</button>
        </div>
      )}
    </div>
  );
}

export interface FinishInfo {
  xpGain: number;
  newBadges: string[];
  newCans: string[];
  comment: string;
  earned: Set<string>;
}

export function Finish({ title, firstTry, days, info, onHome, homeLabel = 'Back home' }: {
  title: string;
  firstTry: Record<string, boolean>;
  days: number;
  info: FinishInfo;
  onHome: () => void;
  homeLabel?: string;
}) {
  const results = Object.values(firstTry);
  const right = results.filter(Boolean).length;
  const toFix = results.length - right;
  const confetti = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    left: `${(i * 37) % 100}%`, delay: `${(i % 8) * 0.25}s`, color: ['#58cc02', '#1cb0f6', '#ff9600', '#ce82ff', '#ffc800'][i % 5],
  })), []);
  useEffect(() => { play(info.newBadges.length || info.newCans.length ? 'badge' : 'done'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="screen">
      <div className="summary-hero">
        <div className="confetti" aria-hidden="true">{confetti.map((c, i) => <i key={i} style={{ left: c.left, animationDelay: c.delay, background: c.color }} />)}</div>
        <Mascot mood="cheer" size={110} />
        <h1>{title}</h1>
        <p className="xp-gain pop">+{info.xpGain} XP</p>
      </div>
      <div className="card bold coach-says">{info.comment}</div>
      {info.newCans.map((c) => (
        <div key={c} className="card new-can pop"><span aria-hidden="true">⭐</span> <b>New: {c}</b></div>
      ))}
      <div className="row">
        <div className="stat"><b>{right}</b><span className="small muted">right first time</span></div>
        <div className="stat"><b>{days}</b><span className="small muted">{days === 1 ? 'day' : 'days'} practised</span></div>
      </div>
      {toFix > 0 && <p className="card orange">{toFix} {toFix === 1 ? 'question comes' : 'questions come'} back tomorrow, so you can fix {toFix === 1 ? 'it' : 'them'}.</p>}
      {info.newBadges.length > 0 && (
        <div className="stack tight">
          <h2>New badge{info.newBadges.length === 1 ? '' : 's'}!</h2>
          <Badges earned={new Set(info.newBadges)} highlight={info.newBadges} onlyEarned />
        </div>
      )}
      <button className="btn block big" onClick={onHome}>{homeLabel}</button>
    </div>
  );
}
