import { useMemo, useState } from 'react';
import type { ChoiceItem, Item, LabelItem, MatchItem, NumberItem, ShortItem, SortItem, WordItem } from '../content/types';
import { Picture, partsOf } from '../pictures';
import { checkMatch, checkNumber, checkSort, checkWord, detectIdeas, shortCorrect } from '../engine/check';
import { seeded, shuffle } from '../engine/rng';
import { numberQuestion } from '../engine/session';
import { Mic } from './Mic';

/** What happened, for the feedback panel and the review boxes. */
export interface Outcome {
  correct: boolean;
  /** The right answer, shown after she has answered. */
  reveal?: string;
  note?: string;
  steps?: string[];
  /** A science word she spelled with a slip, for the spelling queue. */
  misspelt?: string;
  /** She pressed "I don't know": show the answer kindly; it counts as not yet and comes back later. */
  dontKnow?: boolean;
}

/** The answer and working for "I don't know", per question type. */
export function dontKnowOutcome(item: Item, seed: number): Outcome {
  const base = { correct: false, dontKnow: true } as const;
  switch (item.type) {
    case 'choice': return { ...base, reveal: item.answer };
    case 'match': return { ...base, reveal: item.pairs.map(([l, r]) => `${l} → ${r}`).join('\n') };
    case 'sort': return { ...base, reveal: item.bins.map((b) => `${b}: ${item.cards.filter((c) => c.bin === b).map((c) => c.text).join(', ')}`).join('\n') };
    case 'number': {
      const q = numberQuestion(item, seed);
      const unit = item.unit ? (item.unit === '×' ? '×' : ` ${item.unit}`) : '';
      return { ...base, reveal: `${q.answer.toLocaleString('en-GB')}${unit}`, steps: q.steps };
    }
    case 'word': return { ...base, reveal: item.answer };
    case 'short': return { ...base, reveal: item.model, note: `Key ideas: ${item.mustInclude.map((k) => k.idea).join('; ')}` };
    case 'label': {
      const parts = partsOf(item.picture);
      return { ...base, reveal: item.spots.map((k, i) => `${i + 1} → ${parts[k].name}`).join('\n') };
    }
  }
}

interface Props {
  item: Item;
  seed: number;
  onDone: (o: Outcome) => void;
}

export function ItemView({ item, seed, onDone }: Props) {
  switch (item.type) {
    case 'choice': return <Choice item={item} seed={seed} onDone={onDone} />;
    case 'match': return <Match item={item} seed={seed} onDone={onDone} />;
    case 'sort': return <Sort item={item} seed={seed} onDone={onDone} />;
    case 'number': return <NumberQ item={item} seed={seed} onDone={onDone} />;
    case 'word': return <WordQ item={item} onDone={onDone} />;
    case 'short': return <Short item={item} onDone={onDone} />;
    case 'label': return <Label item={item} seed={seed} onDone={onDone} />;
  }
}

function CheckButton({ disabled, onClick, label = 'Check' }: { disabled?: boolean; onClick: () => void; label?: string }) {
  return <button className="btn block big" disabled={disabled} onClick={onClick}>{label}</button>;
}

function Choice({ item, seed, onDone }: { item: ChoiceItem; seed: number; onDone: (o: Outcome) => void }) {
  const options = useMemo(() => shuffle(item.options, seeded(seed)), [item, seed]);
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="stack">
      <p className="qtext">{item.prompt}</p>
      <div className="choices" role="list">
        {options.map((o) => (
          <button key={o} className={`choice${picked === o ? ' selected' : ''}`} onClick={() => setPicked(o)}>{o}</button>
        ))}
      </div>
      <CheckButton disabled={!picked} onClick={() => onDone({ correct: picked === item.answer, reveal: item.answer })} />
    </div>
  );
}

function Match({ item, seed, onDone }: { item: MatchItem; seed: number; onDone: (o: Outcome) => void }) {
  const rights = useMemo(() => shuffle(item.pairs.map((p) => p[1]), seeded(seed)), [item, seed]);
  const [given, setGiven] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(item.pairs[0][0]);
  const lefts = item.pairs.map((p) => p[0]);
  const numberOf = (left: string) => lefts.indexOf(left) + 1;
  const leftFor = (right: string) => Object.keys(given).find((l) => given[l] === right);

  const chooseRight = (r: string) => {
    if (!active) return;
    const next = { ...given };
    const prevOwner = leftFor(r);
    if (prevOwner) delete next[prevOwner];
    next[active] = r;
    setGiven(next);
    setActive(lefts.find((l) => !next[l]) ?? null);
  };
  const done = lefts.every((l) => given[l]);
  return (
    <div className="stack">
      <p className="qtext">{item.prompt}</p>
      <p className="muted small">Tap a word, then tap its match.</p>
      <div className="match-grid">
        <div className="stack tight">
          {lefts.map((l) => (
            <button key={l} className={`choice pair-left${active === l ? ' selected' : ''}${given[l] ? ' paired' : ''}`} onClick={() => setActive(l)}>
              <span className="pair-num">{numberOf(l)}</span>{l}
            </button>
          ))}
        </div>
        <div className="stack tight">
          {rights.map((r) => {
            const owner = leftFor(r);
            return (
              <button key={r} className={`choice pair-right${owner ? ' paired' : ''}`} onClick={() => chooseRight(r)} aria-label={owner ? `${r}, matched to ${owner}` : r}>
                {owner && <span className="pair-num">{numberOf(owner)}</span>}{r}
              </button>
            );
          })}
        </div>
      </div>
      <CheckButton disabled={!done} onClick={() => {
        const wrong = checkMatch(item.pairs, given);
        onDone({ correct: wrong.length === 0, reveal: item.pairs.map(([l, r]) => `${l} → ${r}`).join('\n'), note: wrong.length ? `${wrong.length} not yet matched right.` : undefined });
      }} />
    </div>
  );
}

function Sort({ item, seed, onDone }: { item: SortItem; seed: number; onDone: (o: Outcome) => void }) {
  const cards = useMemo(() => shuffle(item.cards, seeded(seed)), [item, seed]);
  const [given, setGiven] = useState<Record<string, string>>({});
  const done = cards.every((c) => given[c.text]);
  return (
    <div className="stack">
      <p className="qtext">{item.prompt}</p>
      <div className="stack tight">
        {cards.map((c) => (
          <div key={c.text} className="sort-row">
            <span className="sort-card">{c.text}</span>
            <div className="sort-bins">
              {item.bins.map((b) => (
                <button key={b} className={`bin${given[c.text] === b ? ' selected' : ''}`} onClick={() => setGiven({ ...given, [c.text]: b })} aria-pressed={given[c.text] === b}>{b}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <CheckButton disabled={!done} onClick={() => {
        const wrong = checkSort(item.cards, given);
        onDone({
          correct: wrong.length === 0,
          reveal: item.bins.map((b) => `${b}: ${item.cards.filter((c) => c.bin === b).map((c) => c.text).join(', ')}`).join('\n'),
          note: wrong.length ? `Not yet: ${wrong.join(', ')}` : undefined,
        });
      }} />
    </div>
  );
}

function NumberQ({ item, seed, onDone }: { item: NumberItem; seed: number; onDone: (o: Outcome) => void }) {
  const q = useMemo(() => numberQuestion(item, seed), [item, seed]);
  const [raw, setRaw] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const shown = `${q.answer.toLocaleString('en-GB')}${item.unit ? (item.unit === '×' ? '×' : ` ${item.unit}`) : ''}`;
  const check = () => {
    const r = checkNumber(item, q.answer, raw);
    if (r === 'empty') return;
    if (r === 'needUnit') { setHint(`Right number! Now add the unit (${item.unit}).`); return; }
    onDone({ correct: r === 'correct', reveal: shown, steps: q.steps, note: r === 'wrongUnit' ? `The number is right, but the unit is ${item.unit}.` : undefined });
  };
  return (
    <div className="stack">
      <p className="qtext">{q.prompt}</p>
      <div className="answer-box">
        <input className="answer-input" value={raw} onChange={(e) => { setRaw(e.target.value); setHint(null); }}
          onKeyDown={(e) => e.key === 'Enter' && check()} placeholder={item.unit ? `number and unit` : 'number'}
          aria-label="Your answer" autoComplete="off" autoCorrect="off" spellCheck={false} />
      </div>
      {item.unit && <p className="muted small">Write the unit too{item.unit === '×' ? ', e.g. 40× (an x is fine)' : ''}.</p>}
      <Mic base={raw} mode="replace" onText={(t) => { setRaw(t); setHint(null); }} />
      {hint && <p className="hint" role="status">{hint}</p>}
      <CheckButton disabled={!raw.trim()} onClick={check} />
    </div>
  );
}

function WordQ({ item, onDone }: { item: WordItem; onDone: (o: Outcome) => void }) {
  const [raw, setRaw] = useState('');
  const check = () => {
    if (!raw.trim()) return;
    const r = checkWord(item, raw);
    onDone({
      correct: r !== 'wrong',
      reveal: item.answer,
      note: r === 'slip' ? `Nearly perfect. The spelling is: ${item.answer}` : undefined,
      misspelt: r === 'slip' ? item.answer : undefined,
    });
  };
  return (
    <div className="stack">
      <p className="qtext">{item.prompt}</p>
      <input className="answer-input text" value={raw} onChange={(e) => setRaw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()}
        placeholder="Type the word" aria-label="Your answer" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
      <Mic base={raw} mode="replace" onText={setRaw} />
      <CheckButton disabled={!raw.trim()} onClick={check} />
    </div>
  );
}

function Short({ item, onDone }: { item: ShortItem; onDone: (o: Outcome) => void }) {
  const [raw, setRaw] = useState('');
  const [ticks, setTicks] = useState<boolean[] | null>(null);
  const words = raw.trim().split(/\s+/).filter(Boolean).length;

  if (!ticks) {
    return (
      <div className="stack">
        <p className="qtext">{item.prompt}</p>
        <textarea className="answer-text" value={raw} onChange={(e) => setRaw(e.target.value)} rows={5}
          placeholder="Write or say your answer in sentences." aria-label="Your answer" />
        <Mic base={raw} onText={setRaw} />
        <p className="muted small">Answer first (writing or talking), then compare with a model answer.</p>
        <CheckButton disabled={words < 3} onClick={() => setTicks(detectIdeas(item.mustInclude, raw))} label="Compare" />
      </div>
    );
  }
  return (
    <div className="stack">
      <p className="qtext">{item.prompt}</p>
      <div className="card">
        <p className="small muted label">Your answer</p>
        <p className="pre">{raw}</p>
      </div>
      <div className="card blue">
        <p className="small muted label">Model answer</p>
        <p>{item.model}</p>
      </div>
      <p className="bold">Tick each idea you had:</p>
      <div className="stack tight">
        {item.mustInclude.map((k, i) => (
          <label key={k.idea} className={`tick${ticks[i] ? ' on' : ''}`}>
            <input type="checkbox" checked={ticks[i]} onChange={() => setTicks(ticks.map((t, j) => (j === i ? !t : t)))} />
            <span>{k.idea}</span>
          </label>
        ))}
      </div>
      <CheckButton onClick={() => {
        const ok = shortCorrect(ticks);
        const missed = item.mustInclude.filter((_, i) => !ticks[i]).map((k) => k.idea);
        onDone({ correct: ok, note: ok ? 'All the key ideas. Great explaining!' : `Next time add: ${missed.join('; ')}` });
      }} label="Done" />
    </div>
  );
}

function Label({ item, seed, onDone }: { item: LabelItem; seed: number; onDone: (o: Outcome) => void }) {
  const parts = partsOf(item.picture);
  const names = item.spots.map((k) => parts[k].name);
  const chips = useMemo(() => shuffle(names, seeded(seed)), [item, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [given, setGiven] = useState<(string | null)[]>(() => names.map(() => null));
  const [active, setActive] = useState<number | null>(0);

  const choose = (name: string) => {
    if (active === null) return;
    const next = given.map((g) => (g === name ? null : g));
    next[active] = name;
    setGiven(next);
    const free = next.findIndex((g) => !g);
    setActive(free < 0 ? null : free);
  };
  const done = given.every(Boolean);
  return (
    <div className="stack">
      <p className="qtext">{item.prompt}</p>
      <Picture name={item.picture} spots={item.spots} active={active} onSpot={setActive} />
      <p className="muted small">Tap a number, then tap its name.</p>
      <div className="stack tight">
        {names.map((_, i) => (
          <button key={i} className={`choice label-row${active === i ? ' selected' : ''}${given[i] ? ' paired' : ''}`} onClick={() => setActive(i)}>
            <span className="pair-num">{i + 1}</span>{given[i] ?? <span className="muted">?</span>}
          </button>
        ))}
      </div>
      <div className="chips">
        {chips.map((c) => (
          <button key={c} className={`chip-btn${given.includes(c) ? ' used' : ''}`} onClick={() => choose(c)}>{c}</button>
        ))}
      </div>
      <CheckButton disabled={!done} onClick={() => {
        const wrong = names.filter((n, i) => given[i] !== n).length;
        onDone({ correct: wrong === 0, reveal: names.map((n, i) => `${i + 1} → ${n}`).join('\n'), note: wrong ? `${wrong} not yet in the right place.` : undefined });
      }} />
    </div>
  );
}
