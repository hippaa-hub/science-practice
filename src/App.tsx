import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_ITEMS, TOPICS, currentTopic } from './content';
import type { Item } from './content/types';
import { record } from './engine/boxes';
import { buildMix, localDate } from './engine/mix';
import { answer, current, isDone, startSession, type SessionState } from './engine/session';
import { topicStatus } from './engine/status';
import { emptySaved, idbStore, type Saved, type Store } from './storage/db';
import { ItemView, type Outcome } from './ui/ItemView';

type Screen = { name: 'home' } | { name: 'mix'; items: Item[]; session: SessionState } | { name: 'finish'; items: Item[]; session: SessionState };

export default function App({ store = idbStore, now = () => Date.now() }: { store?: Store; now?: () => number }) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  useEffect(() => {
    if (new URLSearchParams(location.search).has('reset')) {
      store.clear().then(() => { history.replaceState(null, '', location.pathname); setSaved(emptySaved()); });
      return;
    }
    store.load().then((s) => setSaved(s ?? emptySaved()));
  }, [store]);

  if (!saved) return <div className="app"><div className="screen center"><p className="muted">Loading…</p></div></div>;

  const persist = (next: Saved) => { setSaved(next); void store.save(next); };

  const start = () => {
    const t = now();
    const items = buildMix({ items: ALL_ITEMS, progress: saved.progress, now: t, today: localDate(t), currentTopic, rand: Math.random });
    setScreen({ name: 'mix', items, session: startSession(items, Math.floor(Math.random() * 1e9)) });
  };

  return (
    <div className="app">
      {screen.name === 'home' && <Home saved={saved} today={localDate(now())} onStart={start} />}
      {screen.name === 'mix' && (
        <Mix
          items={screen.items}
          session={screen.session}
          onAnswer={(item, o, session, firstTry) => {
            let next = saved;
            if (firstTry) next = { ...next, progress: { ...next.progress, [item.id]: record(next.progress[item.id], o.correct, now()) } };
            if (o.misspelt && !next.spelling.includes(o.misspelt)) next = { ...next, spelling: [...next.spelling, o.misspelt] };
            if (isDone(session)) {
              const date = localDate(now());
              const right = Object.values(session.firstTry).filter(Boolean).length;
              next = {
                ...next,
                days: next.days.includes(date) ? next.days : [...next.days, date],
                sessions: [...next.sessions, { date, items: screen.items.length, rightFirstTime: right }],
              };
              setScreen({ name: 'finish', items: screen.items, session });
            } else {
              setScreen({ name: 'mix', items: screen.items, session });
            }
            if (next !== saved) persist(next);
          }}
          onQuit={() => setScreen({ name: 'home' })}
        />
      )}
      {screen.name === 'finish' && <Finish session={screen.session} saved={saved} onHome={() => setScreen({ name: 'home' })} />}
    </div>
  );
}

function Home({ saved, today, onStart }: { saved: Saved; today: string; onStart: () => void }) {
  const doneToday = saved.days.includes(today);
  return (
    <div className="screen">
      <div className="hero-card">
        <div className="hero-cell" aria-hidden="true"><CellIcon /></div>
        <div>
          <h1>Hi Adele!</h1>
          <p className="muted">Ten minutes of science.</p>
        </div>
      </div>

      <button className="btn block big blue" onClick={onStart}>{doneToday ? 'Another mix' : "Start today's mix"}</button>
      {doneToday && <p className="center good">Today's mix is done. Well done!</p>}

      <div className="row">
        <div className="stat"><b>{saved.days.length}</b><span className="small muted">{saved.days.length === 1 ? 'day' : 'days'} practised</span></div>
        <div className="stat"><b>{Object.keys(saved.progress).length}</b><span className="small muted">questions tried</span></div>
      </div>

      <h2>Your topics</h2>
      <div className="stack tight">
        {TOPICS.map((t) => {
          const st = topicStatus(t, saved.progress, today);
          return (
            <div key={t.id} className="card topic-row">
              <div className="grow">
                <p className="bold">{t.title}</p>
                <p className="small muted">{t.unit}{t.id === currentTopic ? ' · in class now' : ''}</p>
              </div>
              <span className={`chip ${st === 'secure' ? 'mastered' : st === 'learning' ? 'learning' : ''}`}>{st}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mix({ items, session, onAnswer, onQuit }: {
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
  useEffect(() => { if (outcome) panel.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' }); }, [outcome]);

  const next = () => {
    if (!outcome) return;
    const r = answer(session, outcome.correct);
    setOutcome(null);
    onAnswer(item, outcome, r.state, r.firstTry);
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button className="iconbtn" onClick={onQuit} aria-label="Stop and go home">✕</button>
        <div className="progress" aria-label={`Question ${session.index + 1} of ${total}`}><div style={{ width: `${(session.index / total) * 100}%` }} /></div>
      </div>
      {entry.repeat && <p className="chip learning">One more try</p>}
      <fieldset className="plain" disabled={!!outcome} key={`${entry.id}-${session.index}`} data-item={entry.id}>
        <ItemView item={item} seed={entry.seed} onDone={setOutcome} />
      </fieldset>
      {outcome && (
        <div ref={panel} className={`feedback ${outcome.correct ? 'ok' : 'notyet'}`} role="status">
          <h2>{outcome.correct ? 'Yes! Correct.' : 'Not yet'}</h2>
          {outcome.note && <p className="bold">{outcome.note}</p>}
          {!outcome.correct && outcome.reveal && <p className="pre"><b>Answer:</b> {outcome.reveal}</p>}
          {outcome.steps && !outcome.correct && <ol className="steps-list">{outcome.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
          <p>{item.explain}</p>
          {!outcome.correct && !entry.repeat && <p className="small muted">This one will come back at the end and again tomorrow.</p>}
          <button className={`btn block big ${outcome.correct ? '' : 'orange'}`} onClick={next} autoFocus>Continue</button>
        </div>
      )}
    </div>
  );
}

function Finish({ session, saved, onHome }: { session: SessionState; saved: Saved; onHome: () => void }) {
  const results = Object.values(session.firstTry);
  const right = results.filter(Boolean).length;
  const toFix = results.length - right;
  const confetti = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    left: `${(i * 37) % 100}%`, delay: `${(i % 8) * 0.25}s`, color: ['#58cc02', '#1cb0f6', '#ff9600', '#ce82ff', '#ffc800'][i % 5],
  })), []);
  return (
    <div className="screen">
      <div className="summary-hero">
        <div className="confetti" aria-hidden="true">{confetti.map((c, i) => <i key={i} style={{ left: c.left, animationDelay: c.delay, background: c.color }} />)}</div>
        <div className="hero-cell big pop" aria-hidden="true"><CellIcon /></div>
        <h1>Mix done!</h1>
        <p className="muted">You finished all {results.length} questions.</p>
      </div>
      <div className="row">
        <div className="stat"><b>{right}</b><span className="small muted">right first time</span></div>
        <div className="stat"><b>{saved.days.length}</b><span className="small muted">{saved.days.length === 1 ? 'day' : 'days'} practised</span></div>
      </div>
      {toFix > 0 && <p className="card orange">{toFix} {toFix === 1 ? 'question comes' : 'questions come'} back tomorrow, so you can fix {toFix === 1 ? 'it' : 'them'}.</p>}
      <button className="btn block big" onClick={onHome}>Back home</button>
    </div>
  );
}

function CellIcon() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <ellipse cx="50" cy="52" rx="42" ry="36" fill="#ddf4ff" stroke="#1cb0f6" strokeWidth="4" />
      <circle cx="45" cy="48" r="15" fill="#ce82ff" />
      <circle cx="41" cy="45" r="5" fill="#a568cc" />
      <ellipse cx="72" cy="66" rx="9" ry="5" fill="#ff9600" transform="rotate(-25 72 66)" />
      <circle cx="26" cy="68" r="3" fill="#58cc02" />
      <circle cx="68" cy="34" r="3" fill="#58cc02" />
      <circle cx="35" cy="73" r="3" fill="#58cc02" />
    </svg>
  );
}
