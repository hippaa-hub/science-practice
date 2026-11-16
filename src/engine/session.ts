import type { Item, NumberItem, NumberQuestion } from '../content/types';
import { seeded } from './rng';

/** One Daily Mix in progress. A wrong first try is shown once more at the end. */
export interface Entry {
  id: string;
  seed: number;
  repeat: boolean;
}

export interface SessionState {
  queue: Entry[];
  index: number;
  /** First-try result per item id. */
  firstTry: Record<string, boolean>;
}

export function startSession(items: Item[], seedBase: number): SessionState {
  return { queue: items.map((i, k) => ({ id: i.id, seed: seedBase + k * 7919, repeat: false })), index: 0, firstTry: {} };
}

export function current(s: SessionState): Entry | undefined {
  return s.queue[s.index];
}

/** Move on after an answer. Returns the new state and whether this was a first try (to record in the boxes). */
export function answer(s: SessionState, correct: boolean): { state: SessionState; firstTry: boolean } {
  const e = s.queue[s.index];
  if (!e) return { state: s, firstTry: false };
  const firstTry = !e.repeat && !(e.id in s.firstTry);
  const queue = [...s.queue];
  const firstTryMap = { ...s.firstTry };
  if (firstTry) {
    firstTryMap[e.id] = correct;
    if (!correct) queue.push({ id: e.id, seed: e.seed + 1, repeat: true });
  }
  return { state: { queue, index: s.index + 1, firstTry: firstTryMap }, firstTry };
}

export function isDone(s: SessionState): boolean {
  return s.index >= s.queue.length;
}

/** A number item's actual question for this showing (random values from the seed, if it has them). */
export function numberQuestion(item: NumberItem, seed: number): NumberQuestion {
  if (!item.make) return { prompt: item.prompt, answer: item.answer, steps: item.steps };
  return item.make(seeded(seed));
}
