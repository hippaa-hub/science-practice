import { useMemo, useState } from 'react';
import { TOPICS } from '../content';
import type { ProgressMap } from '../engine/boxes';
import { checkWord, editDistance, norm } from '../engine/check';
import { blankSentence, usesWord, wordKey, type BankWord } from '../engine/practice';
import { shuffle } from '../engine/rng';

export const ALL_WORDS: BankWord[] = TOPICS.flatMap((t) => t.words.map((w) => ({ ...w, topic: t.id })));

export function WordBank({ progress, spelling, onSpell, onCards, onUse }: {
  progress: ProgressMap;
  spelling: string[];
  onSpell: () => void;
  onCards: (topic: string) => void;
  onUse: () => void;
}) {
  const known = ALL_WORDS.filter((w) => (progress[wordKey(w)]?.box ?? 0) >= 3).length;
  return (
    <div className="screen">
      <h1>Word Bank</h1>
      <p className="muted">{ALL_WORDS.length} science words · {known} spelled well</p>

      <div className="card blue stack tight">
        <h2>Spell it</h2>
        <p>Read the meaning, then type the word.</p>
        {spelling.length > 0 && <p className="small bold">{spelling.length} {spelling.length === 1 ? 'word' : 'words'} from your mixes to practise: {spelling.join(', ')}</p>}
        <button className="btn blue block" onClick={onSpell}>Start spelling</button>
      </div>

      <div className="card purple stack tight">
        <h2>Use it in a sentence</h2>
        <p>Write your own sentence with a science word.</p>
        <button className="btn block ghost" onClick={onUse}>Start</button>
      </div>

      <h2>Flashcards</h2>
      <div className="stack tight">
        {TOPICS.map((t) => (
          <button key={t.id} className="card topic-row as-button" onClick={() => onCards(t.id)}>
            <span className="grow bold">{t.title}</span>
            <span className="small muted">{t.words.length} words ›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Flashcards({ topic, onClose }: { topic: string; onClose: () => void }) {
  const words = ALL_WORDS.filter((w) => w.topic === topic);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const w = words[i];
  const go = (d: number) => { setI((i + d + words.length) % words.length); setFlipped(false); };
  return (
    <div className="screen">
      <div className="topbar">
        <button className="iconbtn" onClick={onClose} aria-label="Close">✕</button>
        <p className="grow small muted">Card {i + 1} of {words.length}</p>
      </div>
      <button className={`flashcard${flipped ? ' back' : ''}`} onClick={() => setFlipped(!flipped)} aria-label={flipped ? 'Show the word' : 'Show the meaning'}>
        {!flipped ? (
          <span className="fc-word">{w.word}</span>
        ) : (
          <span className="stack tight">
            <span className="bold">{w.meaning}</span>
            <span className="muted">"{w.sentence}"</span>
          </span>
        )}
        <span className="small muted fc-hint">{flipped ? 'Tap to see the word' : 'Tap to see the meaning'}</span>
      </button>
      <div className="row">
        <button className="btn ghost grow" onClick={() => go(-1)}>Back</button>
        <button className="btn blue grow" onClick={() => go(1)}>Next</button>
      </div>
    </div>
  );
}

export type SpellResult = 'exact' | 'almost' | 'wrong';

/** One spelling question. Only the exact spelling counts here; "almost" shows where the slip is. */
export function SpellCard({ word, onDone }: { word: BankWord; onDone: (r: SpellResult) => void }) {
  const [raw, setRaw] = useState('');
  const [result, setResult] = useState<SpellResult | null>(null);
  const check = () => {
    if (!raw.trim() || result) return;
    const exact = norm(raw) === norm(word.word);
    const r: SpellResult = exact ? 'exact' : checkWord({ answer: word.word }, raw) !== 'wrong' || editDistance(norm(raw), norm(word.word)) <= 2 ? 'almost' : 'wrong';
    setResult(r);
  };
  return (
    <div className="stack">
      <p className="small muted label">Meaning</p>
      <p className="qtext">{word.meaning}</p>
      <p className="card">"{blankSentence(word.sentence, word.word)}"</p>
      <input className="answer-input text" value={raw} disabled={!!result} onChange={(e) => setRaw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()}
        placeholder="Type the word" aria-label="Your spelling" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
      {!result && <button className="btn block big" disabled={!raw.trim()} onClick={check}>Check</button>}
      {result && (
        <div className={`feedback ${result === 'exact' ? 'ok' : 'notyet'}`} role="status">
          <h2>{result === 'exact' ? 'Perfect spelling!' : result === 'almost' ? 'Almost!' : 'Not yet'}</h2>
          {result !== 'exact' && (
            <>
              <p>The spelling is:</p>
              <Spelling given={raw} target={word.word} />
            </>
          )}
          <button className={`btn block big ${result === 'exact' ? '' : 'orange'}`} onClick={() => onDone(result)} autoFocus>Continue</button>
        </div>
      )}
    </div>
  );
}

/** Shows the right spelling, with letters she missed or changed highlighted. */
function Spelling({ given, target }: { given: string; target: string }) {
  const g = norm(given);
  return (
    <p className="spelling" aria-label={target}>
      {[...target].map((ch, i) => (
        <span key={i} className={g[i]?.toLowerCase() === ch.toLowerCase() ? '' : 'diff'}>{ch}</span>
      ))}
    </p>
  );
}

export function UseIt({ onClose }: { onClose: () => void }) {
  const order = useMemo(() => shuffle(ALL_WORDS, Math.random), []);
  const [i, setI] = useState(0);
  const [raw, setRaw] = useState('');
  const [checked, setChecked] = useState<ReturnType<typeof usesWord> | null>(null);
  const w = order[i % order.length];
  const next = () => { setI(i + 1); setRaw(''); setChecked(null); };
  const ok = checked && checked.used && checked.longEnough;
  return (
    <div className="screen">
      <div className="topbar">
        <button className="iconbtn" onClick={onClose} aria-label="Close">✕</button>
        <p className="grow small muted">Use it in a sentence</p>
      </div>
      <p className="qtext">Write a sentence using <b className="hl">{w.word}</b>.</p>
      <p className="muted small">It means: {w.meaning}</p>
      <textarea className="answer-text" rows={3} value={raw} onChange={(e) => { setRaw(e.target.value); setChecked(null); }} aria-label="Your sentence" placeholder="Your sentence" />
      {!ok && <button className="btn block big" disabled={!raw.trim()} onClick={() => setChecked(usesWord(raw, w.word))}>Check</button>}
      {checked && !ok && (
        <p className="hint" role="status">{!checked.used ? `Include the word "${w.word}" in your sentence.` : 'Make it a full sentence: at least 4 words.'}</p>
      )}
      {ok && (
        <div className="feedback ok" role="status">
          <h2>Great sentence!</h2>
          <p>Another example: "{w.sentence}"</p>
          <button className="btn block big" onClick={next} autoFocus>Next word</button>
        </div>
      )}
      {!ok && <button className="btn ghost block" onClick={next}>Skip this word</button>}
    </div>
  );
}
