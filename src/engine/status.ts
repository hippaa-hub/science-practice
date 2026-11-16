import type { Topic } from '../content/types';
import type { ProgressMap } from './boxes';
import { availableItems } from './mix';

export type TopicStatus = 'new' | 'learning' | 'secure';

/** A topic is secure when 80% of its items are in box 3 or higher. */
export function topicStatus(topic: Topic, progress: ProgressMap, today: string): TopicStatus {
  const items = availableItems(topic.items, today);
  if (items.length === 0) return 'new';
  const seen = items.filter((i) => progress[i.id]);
  if (seen.length === 0) return 'new';
  const strong = items.filter((i) => (progress[i.id]?.box ?? 0) >= 3).length;
  return strong / items.length >= 0.8 ? 'secure' : 'learning';
}
