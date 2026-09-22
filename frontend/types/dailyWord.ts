export interface DailyWord {
    id: string;
    word: string;
    meaning: string;
    example: string;
    synonyms: string;
    level: string;
    learned: boolean;
    /** Only present for A1-B1 learners whose profile language is Persian. */
    meaningFa: string | null;
    exampleFa: string | null;
}
