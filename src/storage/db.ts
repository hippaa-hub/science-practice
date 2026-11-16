import { del, get, set } from 'idb-keyval';
import type { ProgressMap } from '../engine/boxes';
import type { AnswerRecord, MasteryLog, RunKind } from '../engine/motivation';

export interface SessionRecord {
  date: string;
  items: number;
  rightFirstTime: number;
  /** Older records have none: they were all Daily Mixes. */
  kind?: RunKind;
}

export interface Saved {
  version: 1;
  progress: ProgressMap;
  /** Dates (YYYY-MM-DD) she finished a mix. Counted in total; a missed day loses nothing. */
  days: string[];
  sessions: SessionRecord[];
  /** Science words she spelled with a slip: for Word Bank spelling practice (Phase 2). */
  spelling: string[];
  /** Every answer, for XP and badges (both only ever go up). */
  log: AnswerRecord[];
  /** "Things I can do" count per day, for the week-by-week chart. */
  masteryLog: MasteryLog;
  muted: boolean;
}

export interface Store {
  load(): Promise<Saved | null>;
  save(s: Saved): Promise<void>;
  clear(): Promise<void>;
}

const KEY = 'adele-science-v1';

export function emptySaved(): Saved {
  return { version: 1, progress: {}, days: [], sessions: [], spelling: [], log: [], masteryLog: {}, muted: false };
}

/** Progress lives in this device's IndexedDB only. Nothing leaves the phone. */
export const idbStore: Store = {
  async load() {
    try {
      return (await get<Saved>(KEY)) ?? null;
    } catch {
      return null;
    }
  },
  async save(s) {
    await set(KEY, s);
  },
  async clear() {
    await del(KEY);
  },
};

export function memoryStore(initial: Saved | null = null): Store & { current: Saved | null } {
  const store = {
    current: initial,
    async load() { return store.current; },
    async save(s: Saved) { store.current = structuredClone(s); },
    async clear() { store.current = null; },
  };
  return store;
}
