import { TYPED, type Item } from '../content/types';
import type { ProgressMap } from './boxes';
import { shuffle } from './rng';

/**
 * Daily Mix rules (PLAN.md section 5), Phase 1 version:
 * - 5 or 6 due reviews, oldest first, from at least 2 topics when possible
 * - 2 or 3 from the current school topic
 * - 1 "explain why" item
 * - fill with the current topic and the weakest topics
 * - at least 3 typed answers; never 3 of the same topic in a row
 * (The Myth Buster / Predict it! slot arrives with those item types in Phase 3.)
 */
export const MIX_SIZE = 10;

export interface MixInput {
  items: Item[];
  progress: ProgressMap;
  now: number;
  /** YYYY-MM-DD, local date; hides items with a later `from`. */
  today: string;
  currentTopic: string;
  rand: () => number;
  size?: number;
}

export function availableItems(items: Item[], today: string): Item[] {
  return items.filter((i) => !i.from || i.from <= today);
}

export function localDate(t: number): string {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function buildMix(input: MixInput): Item[] {
  const size = input.size ?? MIX_SIZE;
  const { progress, now, currentTopic, rand } = input;
  const pool = availableItems(input.items, input.today);
  const chosen: Item[] = [];
  const has = (i: Item) => chosen.some((c) => c.id === i.id);
  const add = (i: Item | undefined) => { if (i && !has(i) && chosen.length < size) chosen.push(i); };

  // How weak each topic is: average box (unseen = 0).
  const topicIds = [...new Set(pool.map((i) => i.topic))];
  const avgBox = new Map(topicIds.map((t) => {
    const its = pool.filter((i) => i.topic === t);
    return [t, its.reduce((s, i) => s + (progress[i.id]?.box ?? 0), 0) / its.length];
  }));

  // Fresh-first order inside a group: new items in random order, then lowest box, then least recently seen.
  const freshness = (list: Item[]) =>
    shuffle(list, rand).sort((a, b) => {
      const pa = progress[a.id], pb = progress[b.id];
      if (!pa !== !pb) return pa ? 1 : -1;
      if (!pa || !pb) return 0;
      return pa.box - pb.box || pa.lastSeen - pb.lastSeen;
    });

  // 1. Due reviews, oldest first, from at least 2 topics.
  const due = pool
    .filter((i) => progress[i.id] && progress[i.id].due <= now)
    // Oldest first; on a tie, the ones she got wrong first.
    .sort((a, b) => {
      const pa = progress[a.id], pb = progress[b.id];
      return pa.due - pb.due || pa.box - pb.box || pb.timesWrong - pa.timesWrong;
    });
  const reviews = due.slice(0, 6);
  if (new Set(reviews.map((i) => i.topic)).size < 2) {
    const other = due.find((i) => !reviews.includes(i) && i.topic !== reviews[0]?.topic);
    if (other && reviews.length === 6) reviews[5] = other;
    else if (other) reviews.push(other);
  }
  reviews.forEach(add);

  // 2. Two or three from the current school topic (due first, then new, then weakest).
  const currentCandidates = freshness(pool.filter((i) => i.topic === currentTopic && !has(i)));
  const alreadyCurrent = chosen.filter((i) => i.topic === currentTopic).length;
  currentCandidates.slice(0, Math.max(2, 3 - alreadyCurrent)).forEach(add);

  // 3. One "explain why".
  if (!chosen.some(isExplainWhy)) add(freshness(pool.filter((i) => isExplainWhy(i) && !has(i)))[0]);

  // 4. Fill: current topic first, then weakest topics.
  const byWeakness = [...topicIds].sort((a, b) =>
    (a === currentTopic ? -1 : 0) - (b === currentTopic ? -1 : 0) || (avgBox.get(a)! - avgBox.get(b)!));
  // Alternate between the current topic and the weakest others, so one topic doesn't take every slot.
  const queues = byWeakness.map((t) => freshness(pool.filter((i) => i.topic === t && !has(i))));
  while (chosen.length < size && queues.some((q) => q.length)) {
    for (const q of queues) add(q.shift());
  }

  // 5. At least 3 typed answers: swap out non-typed, non-review items.
  const needTyped = 3 - chosen.filter(isTyped).length;
  if (needTyped > 0) {
    const spare = freshness(pool.filter((i) => isTyped(i) && !has(i)));
    for (let k = 0; k < needTyped && spare.length; k++) {
      const idx = findLastIndex(chosen, (i) => !isTyped(i) && !reviews.includes(i) && !isExplainWhy(i));
      if (idx < 0) break;
      chosen[idx] = spare.shift()!;
    }
  }

  return easyFirst(chosen, rand);
}

/**
 * Easy first (Jenia, 22 Nov): a mix starts with tap-and-drag questions, then typed words and numbers,
 * and keeps the written "explain" answers for the end, so the start of each day feels easy.
 * Inside each group the topics are spread out, so no topic comes three times in a row.
 */
export function easyFirst(items: Item[], rand: () => number): Item[] {
  const rank = (i: Item) => (i.type === 'short' ? 2 : i.type === 'word' || i.type === 'number' ? 1 : 0);
  return [0, 1, 2].flatMap((r) => spreadTopics(items.filter((i) => rank(i) === r), rand));
}

export function isTyped(i: Item): boolean {
  return TYPED.includes(i.type);
}

export function isExplainWhy(i: Item): boolean {
  return i.type === 'short' && !!i.explainWhy;
}

/** Shuffle, then reorder so no 3 items of the same topic come in a row (when possible). */
export function spreadTopics(items: Item[], rand: () => number): Item[] {
  // Take from the topic with the most items left (ties at random), skipping a topic that just had 2 in a row.
  const groups = new Map<string, Item[]>();
  for (const i of shuffle(items, rand)) groups.set(i.topic, [...(groups.get(i.topic) ?? []), i]);
  const out: Item[] = [];
  while (out.length < items.length) {
    const n = out.length;
    const blocked = n >= 2 && out[n - 1].topic === out[n - 2].topic ? out[n - 1].topic : null;
    const options = shuffle([...groups.entries()].filter(([t, g]) => g.length && t !== blocked), rand);
    const pickFrom = options.length ? options : [...groups.entries()].filter(([, g]) => g.length);
    pickFrom.sort((x, y) => y[1].length - x[1].length);
    out.push(pickFrom[0][1].shift()!);
  }
  return out;
}

function findLastIndex<T>(a: T[], f: (x: T) => boolean): number {
  for (let i = a.length - 1; i >= 0; i--) if (f(a[i])) return i;
  return -1;
}
