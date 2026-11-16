import { describe, expect, it } from 'vitest';
import { ALL_ITEMS, TOPICS } from '../content';
import { DAY } from './boxes';
import {
  allCans, canCount, canReached, earnedBadges, levelFor, logMastery, finishComment, totalXp, weekGain, weekStart,
  type AnswerRecord,
} from './motivation';

const NOW = new Date('2026-11-18T17:00:00').getTime();
const strong = { box: 3, due: NOW, lastSeen: NOW, timesSeen: 3, timesWrong: 0 };

describe('"I can" statements', () => {
  it('every statement points at real questions in its own topic', () => {
    const ids = new Set(ALL_ITEMS.map((i) => i.id));
    for (const t of TOPICS) {
      expect(t.can.length, t.id).toBeGreaterThanOrEqual(4);
      for (const c of t.can) {
        expect(c.text.startsWith('I can '), c.text).toBe(true);
        for (const id of c.items) {
          expect(ids.has(id), `${c.text}: ${id}`).toBe(true);
          expect(id.startsWith(t.id), `${c.text}: ${id}`).toBe(true);
        }
      }
    }
  });

  it('is reached at two thirds strong, and pauses when not reviewed for over a week', () => {
    const c = allCans(TOPICS).find((x) => x.text === 'I can write the respiration equation')!;
    const p = Object.fromEntries(c.items.slice(0, 2).map((id) => [id, strong]));
    expect(canReached(c, p, NOW)).toBe(false); // 2 of 4
    p[c.items[2]] = strong;
    expect(canReached(c, p, NOW)).toBe(true); // 3 of 4
    expect(canReached(c, p, NOW + 8 * DAY)).toBe(false);
    expect(canCount(TOPICS, p, NOW)).toBeGreaterThanOrEqual(1);
  });

  it('counts this week\'s gain from the daily log', () => {
    expect(weekStart('2026-11-18')).toBe('2026-11-16');
    let log = logMastery({}, 2, '2026-11-13');
    log = logMastery(log, 5, '2026-11-17');
    expect(weekGain(log, 5, '2026-11-18')).toBe(3);
  });
});

describe('XP, levels and badges', () => {
  const r = (id: string, kind: AnswerRecord['kind'], correct: boolean): AnswerRecord => ({ id, kind, correct, date: '2026-11-18' });

  it('XP only adds up: effort and asking count, nothing subtracts', () => {
    const log = [r('a', 'first', true), r('b', 'first', false), r('c', 'dontknow', false), r('b', 'retry', true), r('C3', 'learn', true)];
    expect(totalXp(log, [{ kind: 'daily' }])).toBe(10 + 3 + 3 + 10 + 20 + 25);
    expect(totalXp([...log, r('d', 'first', false)], [{ kind: 'daily' }])).toBeGreaterThan(totalXp(log, [{ kind: 'daily' }]));
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(100).level).toBe(2);
    expect(levelFor(299)).toEqual({ level: 2, into: 199, needed: 200 });
  });

  it('badges: first mix, bookworm, brave learner, diagram expert', () => {
    const log = [r('x', 'dontknow', false), r('C3', 'learn', true), r('x', 'retry', true), r('L1', 'first', true), r('L2', 'retry', true)];
    const got = earnedBadges({ log, sessions: [{}], days: ['2026-11-16', '2026-11-17', '2026-11-18'], cans: 1, labelIds: ['L1', 'L2'], secureTopics: 0 });
    for (const b of ['first-mix', 'first-learn', 'brave', 'labels', 'first-can', 'week-goal']) expect(got.has(b), b).toBe(true);
    expect(got.has('can-5')).toBe(false);
  });

  it('the end-of-mix comment is specific', () => {
    expect(finishComment({ answered: 10, rightFirst: 6, fixed: [], asked: [], newCans: ['I can write the respiration equation'] }, () => ''))
      .toContain('respiration equation');
    expect(finishComment({ answered: 10, rightFirst: 6, fixed: ['q'], asked: [], newCans: [] }, () => 'Which cells make insulin?'))
      .toContain('Which cells make insulin?');
    expect(finishComment({ answered: 10, rightFirst: 6, fixed: [], asked: ['a', 'b'], newCans: [] }, () => '')).toContain('2 questions');
  });
});
