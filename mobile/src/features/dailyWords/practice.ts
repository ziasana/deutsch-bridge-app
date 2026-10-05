import type { DailyWord } from '@/types/dailyWord';

export type PracticeQuestion = {
  wordId: string;
  /** The meaning the learner sees; they pick the German word. */
  prompt: string;
  answer: string;
  options: string[];
};

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * One multiple-choice question per word, with up to 3 distractors taken from the other words.
 * Persian-explanation learners get the Persian meaning when the backend supplied one.
 */
export function buildQuestions(
  words: DailyWord[],
  preferPersian = false,
  random: () => number = Math.random,
): PracticeQuestion[] {
  const questions = words.map((w) => {
    const distractors = shuffle(
      words.filter((o) => o.id !== w.id).map((o) => o.word),
      random,
    ).slice(0, 3);
    return {
      wordId: w.id,
      prompt: preferPersian && w.meaningFa ? w.meaningFa : w.meaning,
      answer: w.word,
      options: shuffle([w.word, ...distractors], random),
    };
  });
  return shuffle(questions, random);
}

export function resultTitle(score: number, total: number): string {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.8) return 'Sehr gut!';
  if (ratio >= 0.5) return 'Gut gemacht!';
  return 'Weiter so!';
}
