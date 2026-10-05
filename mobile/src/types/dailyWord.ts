export interface DailyWord {
  id: string;
  word: string;
  meaning: string;
  example: string | null;
  /** Comma/semicolon separated. */
  synonyms: string | null;
  level: string;
  learned: boolean;
  /** Only present for A1–B1 learners whose explanation language is Persian. */
  meaningFa: string | null;
  exampleFa: string | null;
}
