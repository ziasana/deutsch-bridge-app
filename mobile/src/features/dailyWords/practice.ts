import type { DailyWord } from '@/types/dailyWord';
import { shuffle } from '@/utils/random';

export type PracticeQuestion = {
  wordId: string;
  /** The meaning the learner sees; they pick the German word. */
  prompt: string;
  answer: string;
  options: string[];
};

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
