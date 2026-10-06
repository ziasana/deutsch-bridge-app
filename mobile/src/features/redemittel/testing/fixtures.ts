import type {
  Redemittel,
  RedemittelAnswer,
  RedemittelExercise,
  RedemittelHub,
  RedemittelPage,
} from '@/types/redemittel';

export const makeRedemittel = (n: number, over: Partial<Redemittel> = {}): Redemittel => ({
  id: `r${n}`,
  level: 'B1',
  category: 'OPINION',
  categoryLabel: 'Meinung',
  phrase: `Meiner Meinung nach ${n}`,
  meaning: `In my opinion ${n}`,
  explanation: null,
  example: `Meiner Meinung nach ist das gut ${n}.`,
  formality: 'NEUTRAL',
  usageNote: null,
  grammarPattern: null,
  commonMistake: null,
  similarExpressions: [],
  contexts: ['SPEAKING'],
  status: 'NEW',
  nextReviewAt: null,
  saved: false,
  ...over,
});

export const makeHub = (over: Partial<RedemittelHub> = {}): RedemittelHub => ({
  dueCount: 2,
  newToday: 3,
  dailyTarget: 3,
  learnedToday: 1,
  savedCount: 4,
  summary: { learned: 5, mastered: 1, review: 2, learning: 2, fresh: 10 },
  categories: [{ key: 'OPINION', label: 'Meinung', count: 7 }],
  ...over,
});

export const page = (items: Redemittel[], p = 0, totalPages = 1): RedemittelPage => ({
  items,
  page: p,
  size: 12,
  totalElements: items.length,
  totalPages,
});

export const choice = (n: number): RedemittelExercise => ({
  exerciseId: `e${n}`,
  phraseId: `r${n}`,
  type: 'MEANING',
  prompt: `Was bedeutet Redemittel ${n}?`,
  topic: null,
  phrase: null,
  options: [
    { id: 'a', text: 'Antwort A' },
    { id: 'b', text: 'Antwort B' },
  ],
});

export const wordOrder = (n: number): RedemittelExercise => ({
  exerciseId: `w${n}`,
  phraseId: `r${n}`,
  type: 'WORD_ORDER',
  prompt: 'Bringe die Wörter in die richtige Reihenfolge.',
  topic: null,
  phrase: null,
  options: [
    { id: '1', text: 'Ich' },
    { id: '2', text: 'stimme' },
    { id: '3', text: 'zu' },
  ],
});

export const answer = (over: Partial<RedemittelAnswer> = {}): RedemittelAnswer => ({
  correct: true,
  attempted: false,
  correctAnswer: 'Antwort A',
  modelAnswer: null,
  status: 'LEARNING',
  nextReviewAt: null,
  nextReviewInDays: 3,
  ...over,
});
