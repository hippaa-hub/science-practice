import { useEffect, useState } from 'react';
import { ALL_ITEMS, TOPICS, currentTopic } from './content';
import type { Item, Topic } from './content/types';
import { record } from './engine/boxes';
import { buildMix, localDate } from './engine/mix';
import { learnCheck, spellingSet, topicMix, wordKey, type BankWord } from './engine/practice';
import { answer as advance, current, isDone, startSession, type SessionState } from './engine/session';
import { topicStatus } from './engine/status';
import { emptySaved, idbStore, type Saved, type Store } from './storage/db';
import { CellIcon } from './ui/CellIcon';
import type { Outcome } from './ui/ItemView';
import { Learn } from './ui/Learn';
import { Finish, Run } from './ui/Run';
import { StatusChip, TopicPage, Topics } from './ui/Topics';
import { ALL_WORDS, Flashcards, SpellCard, UseIt, WordBank, type SpellResult } from './ui/Words';

type Tab = 'today' | 'topics' | 'words';
type RunKind = 'daily' | 'topic' | 'check' | 'spell';
type Screen =
  | { name: 'tab'; tab: Tab }
  | { name: 'topic'; topic: Topic }
  | { name: 'learn'; topic: Topic }
  | { name: 'run'; kind: RunKind; items: Item[]; session: SessionState; topic?: Topic }
  | { name: 'finish'; kind: RunKind; firstTry: Record<string, boolean>; topic?: Topic }
  | { name: 'spell'; words: BankWord[]; session: SessionState }
  | { name: 'cards'; topic: string }
  | { name: 'use' };

const FINISH_TITLE: Record<RunKind, string> = { daily: 'Mix done!', topic: 'Practice done!', check: 'Check done!', spell: 'Spelling done!' };

export default function App({ store = idbStore, now = () => Date.now() }: { store?: Store; now?: () => number }) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'tab', tab: 'today' });

  useEffect(() => {
    if (new URLSearchParams(location.search).has('reset')) {
      store.clear().then(() => { history.replaceState(null, '', location.pathname); setSaved(emptySaved()); });
      return;
    }
    store.load().then((s) => setSaved(s ? { ...emptySaved(), ...s } : emptySaved()));
  }, [store]);

  if (!saved) return <div className="app"><div className="screen center"><p className="muted">Loading…</p></div></div>;

  const today = localDate(now());
  const persist = (next: Saved) => { setSaved(next); void store.save(next); };
  const seed = () => Math.floor(Math.random() * 1e9);
  const go = (s: Screen) => { setScreen(s); window.scrollTo?.(0, 0); };
  const markDay = (s: Saved): Saved => (s.days.includes(today) ? s : { ...s, days: [...s.days, today] });

  const startRun = (kind: RunKind, items: Item[], topic?: Topic) => {
    if (!items.length) return;
    go({ name: 'run', kind, items, session: startSession(items, seed()), topic });
  };

  const startDaily = () => {
    startRun('daily', buildMix({ items: ALL_ITEMS, progress: saved.progress, now: now(), today, currentTopic, rand: Math.random }));
  };

  const startSpelling = () => {
    const words = spellingSet(ALL_WORDS, saved.progress, saved.spelling, now(), Math.random);
    go({ name: 'spell', words, session: startSession(words.map((w) => ({ id: wordKey(w) }) as Item), seed()) });
  };

  const tab = screen.name === 'tab' ? screen.tab : null;
  const nav = (
    <nav className="nav" aria-label="Main">
      <button className={tab === 'today' ? 'on' : ''} onClick={() => go({ name: 'tab', tab: 'today' })}><span className="ico" aria-hidden="true">☀️</span>Today</button>
      <button className={tab === 'topics' ? 'on' : ''} onClick={() => go({ name: 'tab', tab: 'topics' })}><span className="ico" aria-hidden="true">🗺️</span>Topics</button>
      <button className={tab === 'words' ? 'on' : ''} onClick={() => go({ name: 'tab', tab: 'words' })}><span className="ico" aria-hidden="true">🔤</span>Words</button>
    </nav>
  );

  let body: JSX.Element;
  switch (screen.name) {
    case 'tab':
      body = (
        <>
          {screen.tab === 'today' && <Home saved={saved} today={today} onStart={startDaily} onOpen={(t) => go({ name: 'topic', topic: t })} />}
          {screen.tab === 'topics' && <Topics progress={saved.progress} today={today} onOpen={(t) => go({ name: 'topic', topic: t })} />}
          {screen.tab === 'words' && (
            <WordBank progress={saved.progress} spelling={saved.spelling} onSpell={startSpelling}
              onCards={(t) => go({ name: 'cards', topic: t })} onUse={() => go({ name: 'use' })} />
          )}
          {nav}
        </>
      );
      break;

    case 'topic':
      body = (
        <TopicPage topic={screen.topic} progress={saved.progress} today={today}
          onBack={() => go({ name: 'tab', tab: 'topics' })}
          onLearn={() => go({ name: 'learn', topic: screen.topic })}
          onPractise={() => startRun('topic', topicMix(screen.topic, saved.progress, now(), today, Math.random), screen.topic)} />
      );
      break;

    case 'learn':
      body = (
        <Learn topic={screen.topic} onClose={() => go({ name: 'topic', topic: screen.topic })}
          onCheck={() => startRun('check', learnCheck(screen.topic, saved.progress, today, Math.random), screen.topic)} />
      );
      break;

    case 'run': {
      const { kind, items, topic } = screen;
      body = (
        <Run items={items} session={screen.session}
          onQuit={() => go(topic ? { name: 'topic', topic } : { name: 'tab', tab: 'today' })}
          onAnswer={(item, o: Outcome, session, firstTry) => {
            let next = saved;
            if (firstTry) next = { ...next, progress: { ...next.progress, [item.id]: record(next.progress[item.id], o.correct, now()) } };
            if (o.misspelt && !next.spelling.includes(o.misspelt)) next = { ...next, spelling: [...next.spelling, o.misspelt] };
            if (isDone(session)) {
              const right = Object.values(session.firstTry).filter(Boolean).length;
              next = markDay({ ...next, sessions: [...next.sessions, { date: today, items: items.length, rightFirstTime: right }] });
              go({ name: 'finish', kind, firstTry: session.firstTry, topic });
            } else {
              setScreen({ ...screen, session });
            }
            if (next !== saved) persist(next);
          }} />
      );
      break;
    }

    case 'finish': {
      const { kind, topic } = screen;
      const back = () => go(topic ? { name: 'topic', topic } : kind === 'spell' ? { name: 'tab', tab: 'words' } : { name: 'tab', tab: 'today' });
      body = <Finish title={FINISH_TITLE[kind]} firstTry={screen.firstTry} days={saved.days.length} onHome={back}
        homeLabel={topic ? `Back to ${topic.title}` : kind === 'spell' ? 'Back to words' : 'Back home'} />;
      break;
    }

    case 'spell': {
      const entry = current(screen.session)!;
      const word = screen.words.find((w) => wordKey(w) === entry.id)!;
      const total = screen.session.queue.length;
      body = (
        <div className="screen">
          <div className="topbar">
            <button className="iconbtn" onClick={() => go({ name: 'tab', tab: 'words' })} aria-label="Stop and go back">✕</button>
            <div className="progress" aria-label={`Word ${screen.session.index + 1} of ${total}`}><div style={{ width: `${(screen.session.index / total) * 100}%` }} /></div>
          </div>
          {entry.repeat && <p className="chip learning">One more try</p>}
          <SpellCard key={`${entry.id}-${screen.session.index}`} word={word} onDone={(r: SpellResult) => {
            const ok = r === 'exact';
            const { state, firstTry } = advance(screen.session, ok);
            const same = (s: string) => s.toLowerCase() === word.word.toLowerCase();
            let next = saved;
            if (firstTry) next = { ...next, progress: { ...next.progress, [entry.id]: record(next.progress[entry.id], ok, now()) } };
            if (ok) next = { ...next, spelling: next.spelling.filter((s) => !same(s)) };
            else if (!next.spelling.some(same)) next = { ...next, spelling: [...next.spelling, word.word] };
            if (isDone(state)) {
              const right = Object.values(state.firstTry).filter(Boolean).length;
              next = markDay({ ...next, sessions: [...next.sessions, { date: today, items: screen.words.length, rightFirstTime: right }] });
              go({ name: 'finish', kind: 'spell', firstTry: state.firstTry });
            } else {
              setScreen({ ...screen, session: state });
            }
            persist(next);
          }} />
        </div>
      );
      break;
    }

    case 'cards':
      body = <Flashcards topic={screen.topic} onClose={() => go({ name: 'tab', tab: 'words' })} />;
      break;

    case 'use':
      body = <UseIt onClose={() => go({ name: 'tab', tab: 'words' })} />;
      break;
  }

  return <div className="app">{body}</div>;
}

function Home({ saved, today, onStart, onOpen }: { saved: Saved; today: string; onStart: () => void; onOpen: (t: Topic) => void }) {
  const doneToday = saved.days.includes(today);
  const tried = Object.keys(saved.progress).filter((k) => !k.startsWith('word:')).length;
  const inClass = TOPICS.find((t) => t.id === currentTopic);
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
      {doneToday && <p className="center good">You practised today. Well done!</p>}

      <div className="row">
        <div className="stat"><b>{saved.days.length}</b><span className="small muted">{saved.days.length === 1 ? 'day' : 'days'} practised</span></div>
        <div className="stat"><b>{tried}</b><span className="small muted">questions tried</span></div>
      </div>

      {inClass && (
        <>
          <h2>In class now</h2>
          <button className="card topic-row as-button" onClick={() => onOpen(inClass)}>
            <span className="grow">
              <span className="bold block">{inClass.title}</span>
              <span className="small muted block">Learn it or practise it</span>
            </span>
            <StatusChip status={topicStatus(inClass, saved.progress, today)} />
          </button>
        </>
      )}
    </div>
  );
}
