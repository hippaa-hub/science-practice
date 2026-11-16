import type { CanStatement, Topic } from '../content/types';
import { DAY, type ItemProgress, type ProgressMap } from './boxes';

/**
 * Motivation, as in the maths and Spanish apps:
 * 1. Progress she can see, in what she CAN DO (the strongest motivator: seeing herself improve).
 * 2. A light game layer: XP that never goes down, levels, badges, Lola's specific comment.
 * Everything is recomputed from the record, so nothing she does can make a number drop
 * (except the honest "can do" count, which pauses a skill she has not reviewed for a long time).
 */

// ---------- the record ----------

export type AnswerKind = 'first' | 'retry' | 'dontknow' | 'spell' | 'learn';

export interface AnswerRecord {
  id: string;
  date: string;
  kind: AnswerKind;
  correct: boolean;
}

export type RunKind = 'daily' | 'topic' | 'check' | 'spell';

// ---------- "Things I can do" ----------

/** A question counts as known when it is strong (box 3+: right on several different days). */
export const FADE_AFTER_DAYS = 7;

export function itemKnown(p: ItemProgress | undefined, now: number): boolean {
  if (!p || p.box < 3) return false;
  return now - p.due <= FADE_AFTER_DAYS * DAY;
}

/** Share of a statement's questions she knows. */
export function canShare(c: CanStatement, progress: ProgressMap, now: number): number {
  return c.items.filter((id) => itemKnown(progress[id], now)).length / c.items.length;
}

/** An "I can…" is hers when two thirds of its questions are strong. */
export const CAN_AT = 2 / 3;

export function canReached(c: CanStatement, progress: ProgressMap, now: number): boolean {
  return canShare(c, progress, now) >= CAN_AT - 1e-9;
}

export function allCans(topics: Topic[]): Array<CanStatement & { topic: string }> {
  return topics.flatMap((t) => t.can.map((c) => ({ ...c, topic: t.id })));
}

export function canCount(topics: Topic[], progress: ProgressMap, now: number): number {
  return allCans(topics).filter((c) => canReached(c, progress, now)).length;
}

/** Daily record of the count, so she can see it grow week by week. */
export type MasteryLog = Record<string, number>;

export function logMastery(log: MasteryLog | undefined, count: number, today: string): MasteryLog {
  if (log?.[today] === count) return log;
  return { ...log, [today]: count };
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week. */
export function weekStart(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  return addDays(day, -((d.getDay() + 6) % 7));
}

function countOn(log: MasteryLog | undefined, day: string): number {
  const days = Object.keys(log ?? {}).filter((d) => d <= day).sort();
  return days.length ? log![days[days.length - 1]] : 0;
}

export function weekGain(log: MasteryLog | undefined, now: number, today: string): number {
  return Math.max(0, now - countOn(log, addDays(weekStart(today), -1)));
}

export function weeklyCounts(log: MasteryLog | undefined, now: number, today: string, weeks = 6) {
  const thisWeek = weekStart(today);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(thisWeek, -7 * (weeks - 1 - i));
    return { week: start, count: i === weeks - 1 ? now : countOn(log, addDays(start, 6)) };
  });
}

// ---------- XP and levels ----------

export const XP = {
  correct: 10,
  /** She tried, or asked to be shown: effort counts. */
  effort: 3,
  /** Got it right on the second go: a fixed mistake. */
  fixed: 10,
  spellPerfect: 5,
  learnDone: 20,
  mixDone: 25,
  practiceDone: 10,
};

export function xpFor(r: AnswerRecord): number {
  switch (r.kind) {
    case 'learn': return XP.learnDone;
    case 'spell': return r.correct ? XP.spellPerfect : XP.effort;
    case 'dontknow': return XP.effort;
    case 'retry': return r.correct ? XP.fixed : XP.effort;
    case 'first': return r.correct ? XP.correct : XP.effort;
  }
}

export interface SessionLike { kind?: RunKind }

export function totalXp(log: AnswerRecord[], sessions: SessionLike[]): number {
  const answers = log.reduce((s, r) => s + xpFor(r), 0);
  const done = sessions.reduce((s, x) => s + ((x.kind ?? 'daily') === 'daily' ? XP.mixDone : XP.practiceDone), 0);
  return answers + done;
}

/** 100, 300, 600, 1000 … XP to reach levels 2, 3, 4, 5 … */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * level;
}

export function levelFor(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level);
  return { level, into: xp - base, needed: xpForLevel(level + 1) - base };
}

// ---------- badges ----------

export interface Badge { id: string; title: string; how: string; icon: string }

export const BADGES: Badge[] = [
  { id: 'first-mix', title: 'First mix', how: 'Finished your first Daily Mix', icon: '🎒' },
  { id: 'first-learn', title: 'Bookworm', how: 'Read all the Learn cards of a topic', icon: '📖' },
  { id: 'brave', title: 'Brave learner', how: 'Pressed "I don\'t know", then got it right later', icon: '🙋' },
  { id: 'first-can', title: 'First "I can"', how: 'Your first thing you can do', icon: '⭐' },
  { id: 'can-5', title: '5 things I can do', how: '5 "I can" statements are yours', icon: '🌟' },
  { id: 'can-10', title: '10 things I can do', how: '10 "I can" statements are yours', icon: '💪' },
  { id: 'week-goal', title: 'Three-day week', how: 'Practised on 3 days in one week', icon: '📅' },
  { id: 'fix-5', title: 'Mistake finder', how: 'Fixed 5 mistakes', icon: '🔍' },
  { id: 'fix-20', title: 'Mistake hunter', how: 'Fixed 20 mistakes', icon: '🕵️' },
  { id: 'labels', title: 'Diagram expert', how: 'Labelled every diagram right', icon: '🏷️' },
  { id: 'words-20', title: 'Word wizard', how: 'Spelled 20 science words perfectly', icon: '🔤' },
  { id: 'q-100', title: '100 questions', how: 'Answered 100 questions', icon: '💯' },
  { id: 'q-500', title: '500 questions', how: 'Answered 500 questions', icon: '🚀' },
  { id: 'days-7', title: '7 practice days', how: 'Practised on 7 different days', icon: '🗓️' },
  { id: 'days-30', title: '30 practice days', how: 'Practised on 30 different days', icon: '🏆' },
  { id: 'topic-secure', title: 'Topic secure', how: 'Made a whole topic secure', icon: '🔬' },
];

export interface BadgeInput {
  log: AnswerRecord[];
  sessions: SessionLike[];
  days: string[];
  cans: number;
  labelIds: string[];
  secureTopics: number;
}

export function earnedBadges(b: BadgeInput): Set<string> {
  const got = new Set<string>();
  const { log } = b;
  if (b.sessions.some((s) => (s.kind ?? 'daily') === 'daily')) got.add('first-mix');
  if (log.some((r) => r.kind === 'learn')) got.add('first-learn');
  const asked = new Set(log.filter((r) => r.kind === 'dontknow').map((r) => r.id));
  if (log.some((r, i) => r.correct && asked.has(r.id) && log.slice(0, i).some((x) => x.kind === 'dontknow' && x.id === r.id))) got.add('brave');
  if (b.cans >= 1) got.add('first-can');
  if (b.cans >= 5) got.add('can-5');
  if (b.cans >= 10) got.add('can-10');
  const byWeek = new Map<string, number>();
  for (const d of b.days) byWeek.set(weekStart(d), (byWeek.get(weekStart(d)) ?? 0) + 1);
  if ([...byWeek.values()].some((n) => n >= 3)) got.add('week-goal');
  const fixed = log.filter((r) => r.kind === 'retry' && r.correct).length;
  if (fixed >= 5) got.add('fix-5');
  if (fixed >= 20) got.add('fix-20');
  const rightLabels = new Set(log.filter((r) => r.correct && b.labelIds.includes(r.id)).map((r) => r.id));
  if (b.labelIds.length && b.labelIds.every((id) => rightLabels.has(id))) got.add('labels');
  if (new Set(log.filter((r) => r.kind === 'spell' && r.correct).map((r) => r.id)).size >= 20) got.add('words-20');
  const answered = log.filter((r) => r.kind !== 'learn').length;
  if (answered >= 100) got.add('q-100');
  if (answered >= 500) got.add('q-500');
  if (b.days.length >= 7) got.add('days-7');
  if (b.days.length >= 30) got.add('days-30');
  if (b.secureTopics >= 1) got.add('topic-secure');
  return got;
}

// ---------- Lola's comment ----------

export interface MixSummary {
  answered: number;
  rightFirst: number;
  fixed: string[];
  asked: string[];
  newCans: string[];
}

/** Short and specific to what she did, never generic praise. */
export function lolaComment(s: MixSummary, prompt: (id: string) => string): string {
  if (s.newCans.length) return `New: "${s.newCans[0]}". That one is yours now!`;
  if (s.fixed.length) return `You missed "${short(prompt(s.fixed[0]))}" and then got it right on the second go. That is exactly how it sticks.`;
  if (s.asked.length) return `You asked about ${s.asked.length === 1 ? 'one question' : `${s.asked.length} questions`} instead of guessing. They come back so you can show you know them now.`;
  if (s.answered && s.rightFirst === s.answered) return `All ${s.answered} right first time. They come back in a few days to make sure they stick.`;
  if (s.answered) return `${s.rightFirst} of ${s.answered} right first time. Everything else comes back tomorrow.`;
  return 'Done for today. See you tomorrow.';
}

function short(t: string): string {
  return t.length > 60 ? `${t.slice(0, 57)}…` : t;
}
