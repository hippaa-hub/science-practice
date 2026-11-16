import { describe, expect, it } from 'vitest';
import { topic as C3 } from '../content/C3-organelles';
import { DAY } from './boxes';
import { blankSentence, learnCheck, spellingSet, usesWord, wordKey, type BankWord } from './practice';
import { seeded } from './rng';

const NOW = new Date('2026-11-18T17:00:00').getTime();

describe('word bank helpers', () => {
  it('hides the word in its sentence, plurals too', () => {
    expect(blankSentence('The plant cells had green chloroplasts.', 'chloroplast')).toBe('The plant cells had green ______.');
    expect(blankSentence('Stem cells are unspecialised.', 'unspecialised')).toBe('Stem cells are ______.');
    expect(blankSentence('Janssen made the first compound microscope in 1590.', 'compound microscope')).toBe('Janssen made the first ______ in 1590.');
  });

  it('checks a sentence uses the word', () => {
    expect(usesWord('The nucleus controls the cell', 'nucleus')).toEqual({ used: true, longEnough: true });
    expect(usesWord('The nucleas controls the cell', 'nucleus').used).toBe(true);
    expect(usesWord('Mitochondria release energy', 'nucleus').used).toBe(false);
    expect(usesWord('nucleus', 'nucleus').longEnough).toBe(false);
    expect(usesWord('I used the objective lens today', 'objective lens').used).toBe(true);
  });

  it('spelling: misspelt words first, then due, then new', () => {
    const w = (word: string): BankWord => ({ word, meaning: '', sentence: '', topic: 'X' });
    const words = [w('alpha'), w('bravo'), w('charlie'), w('delta')];
    const progress = {
      [wordKey(w('bravo'))]: { box: 2, due: NOW - DAY, lastSeen: 0, timesSeen: 1, timesWrong: 0 },
      [wordKey(w('delta'))]: { box: 3, due: NOW + 4 * DAY, lastSeen: 0, timesSeen: 3, timesWrong: 0 },
    };
    const set = spellingSet(words, progress, ['Charlie'], NOW, seeded(1), 4).map((x) => x.word);
    expect(set).toEqual(['charlie', 'bravo', 'alpha', 'delta']);
  });

  it('learn check: 3 quick questions, new ones first, never long writing', () => {
    const items = learnCheck(C3, {}, '2026-11-18', seeded(2));
    expect(items).toHaveLength(3);
    for (const i of items) expect(['short', 'number']).not.toContain(i.type);
    const seenAll = Object.fromEntries(C3.items.map((i) => [i.id, { box: 4, due: NOW, lastSeen: 0, timesSeen: 2, timesWrong: 0 }]));
    delete seenAll['C3-word-nucleus'];
    expect(learnCheck(C3, seenAll, '2026-11-18', seeded(2))[0].id).toBe('C3-word-nucleus');
  });
});
