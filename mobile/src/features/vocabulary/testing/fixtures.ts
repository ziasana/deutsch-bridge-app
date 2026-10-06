import type {
  PracticeVocabularyItem,
  PracticeVocabularySession,
  VocabularyItem,
  VocabularyRoundResponse,
} from '@/types/vocabulary';

export const makeItem = (n: number, withContext = true): PracticeVocabularyItem => ({
  vocabularyItemId: `v${n}`,
  source: 'CUSTOM',
  word: `Wort${n}`,
  article: n === 1 ? 'das' : null,
  meaning: `meaning ${n}`,
  example: `Beispielsatz ${n}.`,
  synonyms: null,
  level: 'A2',
  audioUrl: null,
  masteryLevel: 'NEW',
  isNew: true,
  contextQuestion: withContext
    ? {
        prompt: `Ich suche ___ ${n}.`,
        isCloze: true,
        options: [
          { key: `k${n}a`, text: `Option A${n}` },
          { key: `k${n}b`, text: `Option B${n}` },
        ],
      }
    : null,
});

export const makeSession = (count = 2, withContext = true): PracticeVocabularySession => ({
  items: Array.from({ length: count }, (_, i) => makeItem(i + 1, withContext)),
  newCount: count,
  reviewCount: 0,
});

export const makeRound = (
  over: Partial<VocabularyRoundResponse> = {},
): VocabularyRoundResponse => ({
  flashcardCorrect: true,
  contextCorrect: true,
  correctContextKey: 'k1a',
  progress: {
    recallScore: 1,
    contextScore: 1,
    overallScore: 1,
    reviewCount: 1,
    correctCount: 1,
    incorrectCount: 0,
    masteryLevel: 'LEARNING',
    lastReviewedAt: null,
    nextReviewAt: null,
  },
  ...over,
});

export const makeWord = (n: number, over: Partial<VocabularyItem> = {}): VocabularyItem => ({
  id: `w${n}`,
  source: 'CUSTOM',
  word: `Wort${n}`,
  article: null,
  meaning: `meaning ${n}`,
  language: 'EN',
  example: null,
  synonyms: null,
  level: null,
  audioUrl: null,
  dictionaryEntryId: null,
  createdAt: '2026-01-05T10:00:00Z',
  progress: null,
  bookmarked: false,
  ...over,
});
