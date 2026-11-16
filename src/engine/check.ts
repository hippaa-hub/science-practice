import type { KeyIdea, NumberItem, WordItem } from '../content/types';

/** Answer checking (PLAN.md section 5). */

export function norm(s: string): string {
  return s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'×+→ -]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ---------- choice / match / sort: exact ----------

export function checkChoice(answer: string, picked: string): boolean {
  return answer === picked;
}

/** pairs: [left, right]; given: left -> right she chose. Returns the lefts she got wrong. */
export function checkMatch(pairs: [string, string][], given: Record<string, string>): string[] {
  return pairs.filter(([l, r]) => given[l] !== r).map(([l]) => l);
}

/** Returns the cards she put in the wrong bin. */
export function checkSort(cards: { text: string; bin: string }[], given: Record<string, string>): string[] {
  return cards.filter((c) => given[c.text] !== c.bin).map((c) => c.text);
}

// ---------- numbers ----------

export type NumberResult = 'correct' | 'needUnit' | 'wrongUnit' | 'wrong' | 'empty';

/** Splits "400 ×" / "400x" / "1,200 J" into number and unit text. */
const SMALL: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

/** Spoken answers: "four hundred times" -> "400 times", "seventy five years" -> "75 years". */
export function spokenToDigits(raw: string): string {
  const words = raw.trim().toLowerCase().replace(/-/g, ' ').split(/\s+/);
  let total = 0, chunk = 0, used = 0;
  for (const w of words) {
    if (w in SMALL) chunk += SMALL[w];
    else if (w === 'hundred') chunk = (chunk || 1) * 100;
    else if (w === 'thousand') { total += (chunk || 1) * 1000; chunk = 0; }
    else if (w === 'and' && used > 0) { used++; continue; }
    else break;
    used++;
  }
  if (!used) return raw;
  return [String(total + chunk), ...words.slice(used)].join(' ');
}

export function parseNumberAnswer(raw: string): { value: number | null; unit: string } {
  const s = spokenToDigits(raw).trim().replace(/(\d),(?=\d{3}\b)/g, '$1').replace(/\s+/g, ' ');
  const m = s.match(/^([-−]?\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!m) return { value: null, unit: s };
  const value = Number(m[1].replace('−', '-').replace(',', '.'));
  return { value: Number.isFinite(value) ? value : null, unit: m[2].trim() };
}

export function checkNumber(item: Pick<NumberItem, 'unit' | 'unitAccept' | 'tolerance'>, answer: number, raw: string): NumberResult {
  if (!raw.trim()) return 'empty';
  const { value, unit } = parseNumberAnswer(raw);
  if (value === null) return 'wrong';
  const close = Math.abs(value - answer) <= Math.max(item.tolerance, 1e-9);
  if (!close) return 'wrong';
  if (!item.unit) return 'correct';
  if (!unit) return 'needUnit';
  const ok = [item.unit, ...(item.unitAccept ?? [])].some((u) => u.toLowerCase() === unit.toLowerCase());
  return ok ? 'correct' : 'wrongUnit';
}

// ---------- typed words ----------

export type WordResult = 'exact' | 'slip' | 'wrong';

export function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

/** Small slips count for the mark: 1 letter for short words, 2 for words of 8+ letters. */
export function checkWord(item: Pick<WordItem, 'answer' | 'accept'>, raw: string): WordResult {
  const given = norm(raw);
  if (!given) return 'wrong';
  const targets = [item.answer, ...(item.accept ?? [])].map(norm);
  if (targets.includes(given)) return 'exact';
  for (const t of targets) {
    const allowed = t.length >= 8 ? 2 : t.length >= 4 ? 1 : 0;
    if (editDistance(given, t) <= allowed) return 'slip';
  }
  return 'wrong';
}

// ---------- short written answers ----------

/** Which key ideas her answer seems to contain (pre-ticks the "I had this idea" list). */
export function detectIdeas(ideas: KeyIdea[], raw: string): boolean[] {
  const text = ` ${norm(raw)} `;
  return ideas.map((k) => k.any.some((w) => {
    // A synonym written with spaces round it (' x ') must be a whole word, not part of one.
    const whole = w !== w.trim();
    return text.includes(whole ? ` ${norm(w)} ` : norm(w));
  }));
}

/** Her ticks decide: every key idea ticked = correct. */
export function shortCorrect(ticks: boolean[]): boolean {
  return ticks.length > 0 && ticks.every(Boolean);
}
