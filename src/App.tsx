import { useEffect, useState } from 'react';
import { ALL_ITEMS, TOPICS, currentTopic } from './content';
import type { Item, Topic } from './content/types';
import { record } from './engine/boxes';
import { buildMix, localDate } from './engine/mix';
import {
  allCans, canCount, canReached, earnedBadges, logMastery, finishComment, totalXp, weekGain,
  type AnswerRecord, type RunKind,
} from './engine/motivation';
import { learnCheck, spellingSet, topicMix, wordKey, type BankWord } from './engine/practice';
import { answer as advance, current, isDone, startSession, type SessionState } from './engine/session';
import { topicStatus } from './engine/status';
import { emptySaved, idbStore, type Saved, type Store } from './storage/db';
import type { Outcome } from './ui/ItemView';
import { Learn } from './ui/Learn';
import { Mascot } from './ui/Mascot';
import { MyProgress } from './ui/MyProgress';
import { Finish, Run, type FinishInfo } from './ui/Run';
import { setMuted } from './ui/sounds';
import { StatusChip, TopicPage, Topics } from './ui/Topics';
import { ALL_WORDS, Flashcards, SpellCard, UseIt, WordBank, type SpellResult } from './ui/Words';
import { XpBar } from './ui/XpBar';

type Tab = 'today' | 'topics' | 'words';

/** What things looked like when a session started, to show what is new at the end. */
interface Before { xp: number; badges: string[]; cans: string[]; logLength: number }

type Screen =
  | { name: 'tab'; tab: Tab }
  | { name: 'progress' }
  | { name: 'topic'; topic: Topic }
  | { name: 'learn'; topic: Topic }
  | { name: 'run'; kind: RunKind; items: Item[]; session: SessionState; topic?: Topic; before: Before }
  | { name: 'finish'; kind: RunKind; firstTry: Record<string, boolean>; topic?: Topic; info: FinishInfo }
  | { name: 'spell'; words: BankWord[]; session: SessionState; before: Before }
  | { name: 'cards'; topic: string }
  | { name: 'use' };

const FINISH_TITLE: Record<RunKind, string> = { daily: 'Mix done!', topic: 'Practice done!', check: 'Check done!', spell: 'Spelling done!' };
const LABEL_IDS = ALL_ITEMS.filter((i) => i.type === 'label').map((i) => i.id);
const PROMPT = new Map(ALL_ITEMS.map((i) => [i.id, i.prompt]));

export default function App({ store = idbStore, now = () => Date.now() }: { store?: Store; now?: () => number }) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'tab', tab: 'today' });

  useEffect(() => {
    if (new URLSearchParams(location.search).has('reset')) {
      store.clear().then(() => { history.replaceState(null, '', location.pathname); setSaved(emptySaved()); });
      return;
    }
    store.load().then((s) => {
      const loaded = s ? { ...emptySaved(), ...s } : emptySaved();
      setMuted(loaded.muted);
      setSaved(loaded);
    });
  }, [store]);

  if (!saved) return <div className="app"><div className="screen center"><p className="muted">Loading…</p></div></div>;

  const t = now();
  const today = localDate(t);
  const reachedCans = (s: Saved) => allCans(TOPICS).filter((c) => canReached(c, s.progress, t)).map((c) => c.text);
  const badgesOf = (s: Saved) => earnedBadges({
    log: s.log, sessions: s.sessions, days: s.days, cans: canCount(TOPICS, s.progress, t), labelIds: LABEL_IDS,
    secureTopics: TOPICS.filter((tp) => topicStatus(tp, s.progress, today) === 'secure').length,
  });
  const snapshot = (s: Saved): Before => ({ xp: totalXp(s.log, s.sessions), badges: [...badgesOf(s)], cans: reachedCans(s), logLength: s.log.length });

  const persist = (next: Saved) => {
    const withLog = { ...next, masteryLog: logMastery(next.masteryLog, canCount(TOPICS, next.progress, t), today) };
    setSaved(withLog);
    void store.save(withLog);
  };
  const seed = () => Math.floor(Math.random() * 1e9);
  const go = (s: Screen) => { setScreen(s); window.scrollTo?.(0, 0); };
  const markDay = (s: Saved): Saved => (s.days.includes(today) ? s : { ...s, days: [...s.days, today] });
  const logged = (s: Saved, r: Omit<AnswerRecord, 'date'>): Saved => ({ ...s, log: [...s.log, { ...r, date: today }] });

  const finishInfo = (before: Before, after: Saved, firstTry: Record<string, boolean>): FinishInfo => {
    const earned = badgesOf(after);
    const newCans = reachedCans(after).filter((c) => !before.cans.includes(c));
    const fresh = after.log.slice(before.logLength);
    return {
      xpGain: totalXp(after.log, after.sessions) - before.xp,
      newBadges: [...earned].filter((b) => !before.badges.includes(b)),
      newCans,
      earned,
      comment: finishComment({
        answered: Object.keys(firstTry).length,
        rightFirst: Object.values(firstTry).filter(Boolean).length,
        fixed: fresh.filter((r) => r.kind === 'retry' && r.correct).map((r) => r.id),
        asked: fresh.filter((r) => r.kind === 'dontknow').map((r) => r.id),
        newCans,
      }, (id) => PROMPT.get(id) ?? 'that one'),
    };
  };

  const startRun = (kind: RunKind, items: Item[], topic?: Topic, base: Saved = saved) => {
    if (!items.length) return;
    go({ name: 'run', kind, items, session: startSession(items, seed()), topic, before: snapshot(base) });
  };

  const startDaily = () => {
    startRun('daily', buildMix({ items: ALL_ITEMS, progress: saved.progress, now: t, today, currentTopic, rand: Math.random }));
  };

  const startSpelling = () => {
    const words = spellingSet(ALL_WORDS, saved.progress, saved.spelling, t, Math.random);
    go({ name: 'spell', words, session: startSession(words.map((w) => ({ id: wordKey(w) }) as Item), seed()), before: snapshot(saved) });
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
          {screen.tab === 'today' && (
            <Home saved={saved} today={today} now={t} onStart={startDaily}
              onOpen={(tp) => go({ name: 'topic', topic: tp })}
              onProgress={() => go({ name: 'progress' })}
              onMute={() => { setMuted(!saved.muted); persist({ ...saved, muted: !saved.muted }); }} />
          )}
          {screen.tab === 'topics' && <Topics progress={saved.progress} today={today} onOpen={(tp) => go({ name: 'topic', topic: tp })} />}
          {screen.tab === 'words' && (
            <WordBank progress={saved.progress} spelling={saved.spelling} onSpell={startSpelling}
              onCards={(tp) => go({ name: 'cards', topic: tp })} onUse={() => go({ name: 'use' })} />
          )}
          {nav}
        </>
      );
      break;

    case 'progress':
      body = <MyProgress progress={saved.progress} masteryLog={saved.masteryLog} now={t} today={today} earned={badgesOf(saved)} onBack={() => go({ name: 'tab', tab: 'today' })} />;
      break;

    case 'topic':
      body = (
        <TopicPage topic={screen.topic} progress={saved.progress} today={today}
          onBack={() => go({ name: 'tab', tab: 'topics' })}
          onLearn={() => go({ name: 'learn', topic: screen.topic })}
          onPractise={() => startRun('topic', topicMix(screen.topic, saved.progress, t, today, Math.random), screen.topic)} />
      );
      break;

    case 'learn':
      body = (
        <Learn topic={screen.topic} onClose={() => go({ name: 'topic', topic: screen.topic })}
          onCheck={() => {
            // Reading every card earns XP; the check questions come next.
            const before = saved;
            const next = logged(saved, { id: screen.topic.id, kind: 'learn', correct: true });
            persist(next);
            startRun('check', learnCheck(screen.topic, saved.progress, today, Math.random), screen.topic, before);
          }} />
      );
      break;

    case 'run': {
      const { kind, items, topic, before } = screen;
      body = (
        <Run items={items} session={screen.session}
          onQuit={() => go(topic ? { name: 'topic', topic } : { name: 'tab', tab: 'today' })}
          onAnswer={(item, o: Outcome, session, firstTry) => {
            let next = saved;
            if (firstTry) next = { ...next, progress: { ...next.progress, [item.id]: record(next.progress[item.id], o.correct, t) } };
            next = logged(next, { id: item.id, kind: firstTry ? (o.dontKnow ? 'dontknow' : 'first') : 'retry', correct: o.correct });
            if (o.misspelt && !next.spelling.includes(o.misspelt)) next = { ...next, spelling: [...next.spelling, o.misspelt] };
            if (isDone(session)) {
              const right = Object.values(session.firstTry).filter(Boolean).length;
              next = markDay({ ...next, sessions: [...next.sessions, { date: today, items: items.length, rightFirstTime: right, kind }] });
              go({ name: 'finish', kind, firstTry: session.firstTry, topic, info: finishInfo(before, next, session.firstTry) });
            } else {
              setScreen({ ...screen, session });
            }
            persist(next);
          }} />
      );
      break;
    }

    case 'finish': {
      const { kind, topic } = screen;
      const back = () => go(topic ? { name: 'topic', topic } : kind === 'spell' ? { name: 'tab', tab: 'words' } : { name: 'tab', tab: 'today' });
      body = <Finish title={FINISH_TITLE[kind]} firstTry={screen.firstTry} days={saved.days.length} info={screen.info} onHome={back}
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
            if (firstTry) next = { ...next, progress: { ...next.progress, [entry.id]: record(next.progress[entry.id], ok, t) } };
            next = logged(next, { id: entry.id, kind: 'spell', correct: ok });
            if (ok) next = { ...next, spelling: next.spelling.filter((s) => !same(s)) };
            else if (!next.spelling.some(same)) next = { ...next, spelling: [...next.spelling, word.word] };
            if (isDone(state)) {
              const right = Object.values(state.firstTry).filter(Boolean).length;
              next = markDay({ ...next, sessions: [...next.sessions, { date: today, items: screen.words.length, rightFirstTime: right, kind: 'spell' }] });
              go({ name: 'finish', kind: 'spell', firstTry: state.firstTry, info: finishInfo(screen.before, next, state.firstTry) });
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

function Home({ saved, today, now, onStart, onOpen, onProgress, onMute }: {
  saved: Saved; today: string; now: number;
  onStart: () => void; onOpen: (t: Topic) => void; onProgress: () => void; onMute: () => void;
}) {
  const doneToday = saved.days.includes(today);
  const inClass = TOPICS.find((tp) => tp.id === currentTopic);
  const cans = canCount(TOPICS, saved.progress, now);
  const gain = weekGain(saved.masteryLog, cans, today);
  const total = allCans(TOPICS).length;
  const xp = totalXp(saved.log, saved.sessions);
  return (
    <div className="screen">
      <div className="home-top">
        <XpBar xp={xp} />
        <button className="iconbtn" onClick={onMute} aria-label={saved.muted ? 'Turn sounds on' : 'Turn sounds off'}>{saved.muted ? '🔇' : '🔊'}</button>
      </div>

      <div className="hero">
        <Mascot mood={doneToday ? 'cheer' : 'wave'} size={88} animate={!doneToday} />
        <div className="bubble">{doneToday ? 'I practised today!' : 'Ready for ten minutes of science?'}</div>
      </div>

      <button className="btn block big blue" onClick={onStart}>{doneToday ? 'Another mix' : "Start today's mix"}</button>

      <button className="cando-strip" onClick={onProgress}>
        <span className="paw" aria-hidden="true">⭐</span>
        <span className="num">{cans}</span>
        <span className="grow">
          <b>{cans === 1 ? 'thing' : 'things'} you can do</b>
          <span className="small muted">{gain > 0 ? `+${gain} this week · ` : ''}of {total} · see my progress</span>
        </span>
        <span aria-hidden="true">›</span>
      </button>

      <div className="row">
        <div className="stat"><b>{saved.days.length}</b><span className="small muted">{saved.days.length === 1 ? 'day' : 'days'} practised</span></div>
        <div className="stat"><b>{Object.keys(saved.progress).filter((k) => !k.startsWith('word:')).length}</b><span className="small muted">questions tried</span></div>
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
