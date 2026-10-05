import type { DailyWord } from '@/types/dailyWord';

export const learnedCount = (words: DailyWord[]) => words.filter((w) => w.learned).length;
export const allLearned = (words: DailyWord[]) => words.length > 0 && words.every((w) => w.learned);

/** Where the learner should start: the first word they haven't learned yet (or the first word). */
export function firstUnlearnedIndex(words: DailyWord[]): number {
  const i = words.findIndex((w) => !w.learned);
  return i === -1 ? 0 : i;
}

/** After finishing word `from`: the next unlearned word after it, else the next word, else null (end). */
export function nextIndex(words: DailyWord[], from: number): number | null {
  const unlearned = words.findIndex((w, i) => i > from && !w.learned);
  if (unlearned !== -1) return unlearned;
  return from < words.length - 1 ? from + 1 : null;
}

export const normalizeWord = (word: string) => word.trim().toLowerCase();

export function splitSynonyms(synonyms: string | null): string[] {
  return (synonyms ?? '')
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
