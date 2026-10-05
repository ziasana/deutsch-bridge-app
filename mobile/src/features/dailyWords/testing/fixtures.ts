import type { DailyWord } from '@/types/dailyWord';

export const makeWords = (learned: boolean[] = [false, false, false, false, false]): DailyWord[] =>
  ['berücksichtigen', 'Entscheidung', 'verbessern', 'Erfahrung', 'vorschlagen'].map((word, i) => ({
    id: `w${i + 1}`,
    word,
    meaning: `meaning of ${word}`,
    example: `Beispiel mit ${word}.`,
    synonyms: i === 0 ? 'beachten, bedenken' : null,
    level: 'B1',
    learned: learned[i] ?? false,
    meaningFa: null,
    exampleFa: null,
  }));
