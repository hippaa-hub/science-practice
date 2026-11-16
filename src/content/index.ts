import type { Item, Topic } from './types';
import { topic as C1 } from './C1-cells-stem-cells';
import { topic as C2 } from './C2-microscopes';
import { topic as C3 } from './C3-organelles';

/** Add a new school topic: make a file like C3-organelles.ts and add it to this list. */
export const TOPICS: Topic[] = [C1, C2, C3];

/** What her class is studying right now. The Daily Mix always includes some of it. */
export const currentTopic = 'C3';

export const ALL_ITEMS: Item[] = TOPICS.flatMap((t) => t.items);

export function topicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}
