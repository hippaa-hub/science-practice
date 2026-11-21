import { describe, expect, it } from 'vitest';
import type { Item } from '../content/types';
import { DAY, WAIT_DAYS, record, startOfDay } from './boxes';
import { checkNumber, checkWord, detectIdeas, parseNumberAnswer } from './check';
import { buildMix, isTyped, isExplainWhy } from './mix';
import { seeded } from './rng';
import { answer, isDone, startSession } from './session';

const NOW = new Date('2026-11-17T17:00:00').getTime();

describe('review boxes', () => {
  it('uses the planned waits', () => {
    expect(WAIT_DAYS).toEqual([0, 1, 2, 4, 8, 16, 30]);
  });
  it('moves up one box when right first time', () => {
    const p = record(undefined, true, NOW);
    expect(p.box).toBe(1);
    expect(p.due).toBe(startOfDay(NOW) + DAY);
    const p2 = record(p, true, NOW);
    expect(p2.box).toBe(2);
    expect(p2.due).toBe(startOfDay(NOW) + 2 * DAY);
  });
  it('drops to box 1 when wrong', () => {
    const p = record({ box: 4, due: 0, lastSeen: 0, timesSeen: 3, timesWrong: 0 }, false, NOW);
    expect(p.box).toBe(1);
    expect(p.timesWrong).toBe(1);
  });
  it('after box 5 waits 30 days', () => {
    const p = record({ box: 5, due: 0, lastSeen: 0, timesSeen: 5, timesWrong: 0 }, true, NOW);
    expect(p.due).toBe(startOfDay(NOW) + 30 * DAY);
  });
});

describe('session', () => {
  it('shows a wrong first try once more at the end', () => {
    const items = [{ id: 'a' }, { id: 'b' }] as Item[];
    let s = startSession(items, 1);
    let r = answer(s, false);
    expect(r.firstTry).toBe(true);
    s = r.state;
    r = answer(s, true); s = r.state;
    expect(isDone(s)).toBe(false);
    expect(s.queue[s.index].id).toBe('a');
    r = answer(s, false);
    expect(r.firstTry).toBe(false);
    expect(isDone(r.state)).toBe(true);
    expect(r.state.firstTry).toEqual({ a: false, b: true });
  });
});

// A small fake bank: 3 topics, mixed types.
function bank(): Item[] {
  const out: Item[] = [];
  for (const t of ['A', 'B', 'C']) {
    for (let k = 0; k < 12; k++) {
      const type = (['choice', 'word', 'match', 'short', 'sort', 'number'] as const)[k % 6];
      out.push({ id: `${t}${k}`, topic: t, type, prompt: '', explain: '', explainWhy: type === 'short' && k === 3 ? true : undefined } as Item);
    }
  }
  return out;
}

describe('daily mix', () => {
  it('first day: 10 items, current topic included, typed and explain rules', () => {
    for (let seed = 1; seed < 40; seed++) {
      const mix = buildMix({ items: bank(), progress: {}, now: NOW, today: '2026-11-17', currentTopic: 'B', rand: seeded(seed) });
      expect(mix).toHaveLength(10);
      expect(new Set(mix.map((i) => i.id)).size).toBe(10);
      expect(mix.filter((i) => i.topic === 'B').length).toBeGreaterThanOrEqual(2);
      expect(mix.filter(isTyped).length).toBeGreaterThanOrEqual(3);
      expect(mix.some(isExplainWhy)).toBe(true);
      // Easy first: tap/drag questions, then typed, then written; no 3 of a topic in a row inside a group.
      const rank = (t: string) => (t === 'short' ? 2 : t === 'word' || t === 'number' ? 1 : 0);
      for (let i = 1; i < mix.length; i++) expect(rank(mix[i].type)).toBeGreaterThanOrEqual(rank(mix[i - 1].type));
      for (const r of [0, 1, 2]) {
        const group = mix.filter((i) => rank(i.type) === r);
        for (let i = 2; i < group.length; i++) {
          const run = group[i].topic === group[i - 1].topic && group[i].topic === group[i - 2].topic;
          // Three in a row is only allowed when that topic fills more than half the group, so it cannot be avoided.
          const share = group.filter((g) => g.topic === group[i].topic).length;
          if (run) expect(share * 2).toBeGreaterThan(group.length);
        }
      }
    }
  });

  it('puts due reviews in, oldest first, from 2+ topics', () => {
    const items = bank();
    const progress: Record<string, ReturnType<typeof record>> = {};
    ['A1', 'A2', 'A4', 'A5', 'A7', 'A8', 'A10', 'C1'].forEach((id, k) => {
      progress[id] = { box: 1, due: NOW - (10 - k) * DAY, lastSeen: NOW - 20 * DAY, timesSeen: 1, timesWrong: 1 };
    });
    progress['C2'] = { box: 3, due: NOW + 3 * DAY, lastSeen: NOW, timesSeen: 3, timesWrong: 0 }; // not due
    const mix = buildMix({ items, progress, now: NOW, today: '2026-11-17', currentTopic: 'B', rand: seeded(3) });
    const ids = mix.map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(['A1', 'A2', 'A4', 'A5', 'A7', 'C1']));
    expect(ids).not.toContain('C2');
    expect(mix.filter((i) => i.topic === 'B').length).toBeGreaterThanOrEqual(2);
  });

  it('hides items until their from date', () => {
    const items = bank().map((i) => (i.topic === 'B' ? { ...i, from: '2026-11-18' } : i));
    const mix = buildMix({ items, progress: {}, now: NOW, today: '2026-11-17', currentTopic: 'B', rand: seeded(1) });
    expect(mix.some((i) => i.topic === 'B')).toBe(false);
  });
});

describe('checking answers', () => {
  const mag = { unit: '×', unitAccept: ['x', 'X', '×', 'times'], tolerance: 0 };
  it('numbers need the unit, but a missing unit is not a fail', () => {
    expect(checkNumber(mag, 400, '400×')).toBe('correct');
    expect(checkNumber(mag, 400, '400 x')).toBe('correct');
    expect(checkNumber(mag, 400, '400')).toBe('needUnit');
    expect(checkNumber(mag, 400, '40x')).toBe('wrong');
    expect(checkNumber(mag, 400, '400 J')).toBe('wrongUnit');
    expect(checkNumber({ unit: '', tolerance: 0 }, 300000, '300,000')).toBe('correct');
    expect(checkNumber({ unit: 'kJ', tolerance: 0.1 }, 4.2, '4,2 kJ')).toBe('correct');
  });
  it('parses numbers with spaces and commas', () => {
    expect(parseNumberAnswer('1,200 J')).toEqual({ value: 1200, unit: 'J' });
  });
  it('words: small slips count, but are flagged', () => {
    const w = { answer: 'mitochondria', accept: ['mitochondrion'] };
    expect(checkWord(w, 'Mitochondria')).toBe('exact');
    expect(checkWord(w, 'mitocondria')).toBe('slip');
    expect(checkWord(w, 'mitocondra')).toBe('slip');
    expect(checkWord(w, 'nucleus')).toBe('wrong');
    expect(checkWord({ answer: 'cell' }, 'cel')).toBe('slip');
    expect(checkWord({ answer: 'cell' }, 'wall')).toBe('wrong');
  });
  it('finds key ideas in a written answer', () => {
    const ideas = [{ idea: 'w', any: ['wall'] }, { idea: 'c', any: ['chloroplast', 'green'] }, { idea: 'x', any: [' x ', 'multipl'] }];
    expect(detectIdeas(ideas, 'Plant cells have a cell wall and are Green')).toEqual([true, true, false]);
    expect(detectIdeas(ideas, 'next to it, 10 x 40')).toEqual([false, false, true]);
  });
});
