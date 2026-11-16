import { describe, expect, it } from 'vitest';
import { checkNumber, checkWord, detectIdeas, norm } from '../engine/check';
import { numberQuestion } from '../engine/session';
import { ALL_ITEMS, TOPICS, currentTopic } from './index';
import { hasPicture, partsOf } from '../pictures';

describe('content', () => {
  it('ids are unique and topics match', () => {
    const ids = ALL_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TOPICS) for (const i of t.items) expect(i.topic).toBe(t.id);
    expect(TOPICS.some((t) => t.id === currentTopic)).toBe(true);
  });

  it('meets the version 1 targets per topic', () => {
    for (const t of TOPICS) {
      expect(t.items.length, t.id).toBeGreaterThanOrEqual(20);
      expect(new Set(t.items.map((i) => i.type)).size, t.id).toBeGreaterThanOrEqual(5);
      expect(t.words.length, t.id).toBeGreaterThanOrEqual(8);
      expect(t.learn.length, t.id).toBeGreaterThanOrEqual(4);
      expect(t.items.some((i) => i.type === 'short' && i.explainWhy), t.id).toBe(true);
    }
  });

  it('every item can be answered correctly', () => {
    for (const i of ALL_ITEMS) {
      if (i.type === 'choice') expect(i.options, i.id).toContain(i.answer);
      if (i.type === 'sort') for (const c of i.cards) expect(i.bins, i.id).toContain(c.bin);
      if (i.type === 'match') expect(new Set(i.pairs.map((p) => p[1])).size, i.id).toBe(i.pairs.length);
      if (i.type === 'word') expect(checkWord(i, i.answer), i.id).toBe('exact');
      if (i.type === 'short') expect(detectIdeas(i.mustInclude, i.model).every(Boolean), `${i.id}: model must contain every key idea`).toBe(true);
      if (i.type === 'number') {
        for (let s = 0; s < 30; s++) {
          const q = numberQuestion(i, s);
          const typed = `${q.answer}${i.unit ? ` ${i.unitAccept?.[0] ?? i.unit}` : ''}`;
          expect(checkNumber(i, q.answer, typed), `${i.id} seed ${s}`).toBe('correct');
          const steps = q.steps.join(' ').replace(/,(?=\d{3})/g, '');
          expect(steps, i.id).toContain(String(q.answer));
        }
      }
    }
  });

  it('pictures and diagram parts exist', () => {
    for (const t of TOPICS) {
      for (const c of t.learn) {
        if (c.picture) expect(hasPicture(c.picture), `${t.id} ${c.title}`).toBe(true);
        for (const l of c.labels ?? []) expect(partsOf(c.picture!)[l], `${t.id} ${c.title} ${l}`).toBeDefined();
        expect(c.picture, `${t.id} ${c.title} needs a picture`).toBeDefined();
      }
    }
    for (const i of ALL_ITEMS) if (i.type === 'label') {
      expect(hasPicture(i.picture), i.id).toBe(true);
      for (const k of i.spots) expect(partsOf(i.picture)[k], `${i.id} ${k}`).toBeDefined();
      expect(new Set(i.spots).size, i.id).toBe(i.spots.length);
    }
  });

  it('word bank: each sentence uses its word, and the meaning does not give it away', () => {
    for (const t of TOPICS) for (const w of t.words) {
      expect(w.sentence.toLowerCase(), `${t.id} ${w.word}`).toContain(w.word.toLowerCase());
      expect(w.meaning.toLowerCase().includes(w.word.toLowerCase()), `${t.id} ${w.word} meaning`).toBe(false);
    }
    const all = TOPICS.flatMap((t) => t.words.map((w) => w.word.toLowerCase()));
    expect(new Set(all).size).toBe(all.length);
  });

  it('never gives the answer away in the question', () => {
    for (const i of ALL_ITEMS) {
      const p = norm(i.prompt);
      if (i.type === 'word') for (const a of [i.answer, ...(i.accept ?? [])]) expect(p.includes(norm(a)), `${i.id} prompt contains "${a}"`).toBe(false);
      if (i.type === 'number') for (let s = 0; s < 10; s++) {
        const q = numberQuestion(i, s);
        expect(new RegExp(`(^|[^0-9,])${q.answer}([^0-9,]|$)`).test(q.prompt.replace(/,(?=\d{3})/g, '')), `${i.id} seed ${s}`).toBe(false);
      }
    }
  });

  it('keeps the teacher\'s name and surnames out of the app code', () => {
    const files = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    expect(Object.keys(files).length).toBeGreaterThan(5);
    for (const [f, src] of Object.entries(files)) expect(/Lizi|Kurtskhalia|Fleshler/i.test(src), f).toBe(false);
  });
});

