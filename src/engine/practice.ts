import type { Item, Topic, Word } from '../content/types';
import type { ProgressMap } from './boxes';
import { availableItems, buildMix } from './mix';
import { shuffle } from './rng';

/** Practise one topic: same rules as the Daily Mix, all from that topic. */
export function topicMix(topic: Topic, progress: ProgressMap, now: number, today: string, rand: () => number, size = 8): Item[] {
  return buildMix({ items: topic.items, progress, now, today, currentTopic: topic.id, rand, size });
}

/** 2 or 3 quick check questions after the Learn cards: new ones first, no long written answers. */
export function learnCheck(topic: Topic, progress: ProgressMap, today: string, rand: () => number, size = 3): Item[] {
  const pool = availableItems(topic.items, today).filter((i) => i.type !== 'short' && i.type !== 'number');
  const unseen = shuffle(pool.filter((i) => !progress[i.id]), rand);
  const seen = shuffle(pool.filter((i) => progress[i.id]), rand).sort((a, b) => progress[a.id].box - progress[b.id].box);
  return [...unseen, ...seen].slice(0, size);
}

/** Share of a topic's questions that are strong (box 3+). */
export function topicStrength(topic: Topic, progress: ProgressMap, today: string): number {
  const items = availableItems(topic.items, today);
  if (!items.length) return 0;
  return items.filter((i) => (progress[i.id]?.box ?? 0) >= 3).length / items.length;
}

// ---------- Word Bank ----------

export interface BankWord extends Word {
  topic: string;
}

export const wordKey = (w: Word) => `word:${w.word.toLowerCase()}`;

/** Spelling practice: words she misspelt first, then words due again, then new ones, then the rest. */
export function spellingSet(words: BankWord[], progress: ProgressMap, queue: string[], now: number, rand: () => number, size = 8): BankWord[] {
  const inQueue = (w: Word) => queue.some((q) => q.toLowerCase() === w.word.toLowerCase());
  const p = (w: Word) => progress[wordKey(w)];
  const first = shuffle(words.filter(inQueue), rand);
  const due = shuffle(words.filter((w) => !inQueue(w) && p(w) && p(w).due <= now), rand);
  const fresh = shuffle(words.filter((w) => !inQueue(w) && !p(w)), rand);
  const rest = shuffle(words.filter((w) => !inQueue(w) && p(w) && p(w).due > now), rand).sort((a, b) => p(a).box - p(b).box);
  return [...first, ...due, ...fresh, ...rest].slice(0, size);
}

/** The example sentence with the word hidden: "The ______ stains blue." */
export function blankSentence(sentence: string, word: string): string {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return sentence.replace(new RegExp(`${esc}\\w*`, 'gi'), '______');
}

/** "Use it in a sentence": did she use the word (small slips allowed) in a real sentence (4+ words)? */
export function usesWord(sentence: string, word: string): { used: boolean; longEnough: boolean } {
  const text = sentence.toLowerCase().replace(/[^a-z\s-]/g, ' ');
  const target = word.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const n = target.split(/\s+/).length;
  let used = false;
  for (let i = 0; i + n <= words.length && !used; i++) {
    const chunk = words.slice(i, i + n).join(' ');
    if (chunk.startsWith(target) || near(chunk, target)) used = true;
  }
  return { used, longEnough: words.length >= 4 };
}

function near(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 2) return false;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return dp[a.length][b.length] <= (b.length >= 8 ? 2 : 1);
}
