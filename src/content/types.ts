/** Content format (PLAN.md section 7). One file per topic; the app code never changes when a topic is added. */

export type TopicId = string;

export interface LearnCard {
  title: string;
  text: string;
  /** Name of a picture in src/pictures. */
  picture?: string;
  /** Diagram parts to number and name under the picture. */
  labels?: string[];
  /** An illustration in public/img (name without .webp), shown above the diagram. */
  photo?: string;
  example?: string;
}

export interface Word {
  word: string;
  meaning: string;
  sentence: string;
}

interface Base {
  id: string;
  topic: TopicId;
  prompt: string;
  /** Shown after every answer, right or wrong. */
  explain: string;
  /** Hide until this date (YYYY-MM-DD), e.g. while it would answer homework that is still due. */
  from?: string;
  /** An illustration in public/img, shown with the explanation AFTER she answers (never before). */
  photo?: string;
}

export interface ChoiceItem extends Base {
  type: 'choice';
  options: string[];
  answer: string;
}

export interface MatchItem extends Base {
  type: 'match';
  /** [left, right]; the right side is shuffled on screen. */
  pairs: [string, string][];
}

export interface SortItem extends Base {
  type: 'sort';
  bins: string[];
  /** card text -> bin it belongs in */
  cards: { text: string; bin: string }[];
}

export interface NumberQuestion {
  prompt: string;
  answer: number;
  steps: string[];
}

export interface NumberItem extends Base {
  type: 'number';
  answer: number;
  /** Unit she must type, e.g. "×", "J", "kJ". Synonyms in unitAccept. */
  unit: string;
  unitAccept?: string[];
  tolerance: number;
  steps: string[];
  /** Fresh random values each time (seeded), so it never repeats exactly. Overrides prompt/answer/steps. */
  make?: (rand: () => number) => NumberQuestion;
}

export interface WordItem extends Base {
  type: 'word';
  answer: string;
  accept?: string[];
}

export interface KeyIdea {
  /** What the idea is, as shown on the tick list. */
  idea: string;
  /** Any of these words/phrases in her answer counts as having the idea. */
  any: string[];
}

export interface ShortItem extends Base {
  type: 'short';
  mustInclude: KeyIdea[];
  model: string;
  /** "Explain why" items count toward the explain slot in the Daily Mix. */
  explainWhy?: boolean;
}

export interface LabelItem extends Base {
  type: 'label';
  /** Name of a diagram in src/pictures. */
  picture: string;
  /** Parts of that diagram to label (their names come from the diagram). */
  spots: string[];
}

export type Item = ChoiceItem | MatchItem | SortItem | NumberItem | WordItem | ShortItem | LabelItem;
export type ItemType = Item['type'];

export interface Topic {
  id: TopicId;
  unit: string;
  title: string;
  learn: LearnCard[];
  items: Item[];
  words: Word[];
}

/** Items she has to type into (the mix needs at least 3 of these). */
export const TYPED: ItemType[] = ['number', 'word', 'short'];
