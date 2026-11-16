/**
 * Review boxes (PLAN.md section 5).
 * Box 0 = new / same session, 1 = 1 day, 2 = 2 days, 3 = 4 days, 4 = 8 days, 5 = 16 days.
 * Correct again while in box 5 moves it to the "long" box 6 = 30 days.
 */
export const WAIT_DAYS = [0, 1, 2, 4, 8, 16, 30];
export const TOP_BOX = WAIT_DAYS.length - 1;
export const DAY = 24 * 60 * 60 * 1000;

export interface ItemProgress {
  box: number;
  /** When it is due again (ms since 1970). */
  due: number;
  lastSeen: number;
  timesSeen: number;
  timesWrong: number;
}

export type ProgressMap = Record<string, ItemProgress>;

/** Start of the local day, so "due in 1 day" means "tomorrow", whatever the time. */
export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dueAfter(box: number, now: number): number {
  const days = WAIT_DAYS[Math.max(0, Math.min(TOP_BOX, box))];
  return days === 0 ? now : startOfDay(now) + days * DAY;
}

/** Record a first-try answer. Correct: up one box. Wrong: down to box 1. */
export function record(prev: ItemProgress | undefined, correct: boolean, now: number): ItemProgress {
  const box = correct ? Math.min(TOP_BOX, (prev?.box ?? 0) + 1) : 1;
  return {
    box,
    due: dueAfter(box, now),
    lastSeen: now,
    timesSeen: (prev?.timesSeen ?? 0) + 1,
    timesWrong: (prev?.timesWrong ?? 0) + (correct ? 0 : 1),
  };
}

export function isDue(p: ItemProgress | undefined, now: number): boolean {
  return !!p && p.due <= now;
}
