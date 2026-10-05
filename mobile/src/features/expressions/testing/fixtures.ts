import type {
  Expression,
  ExpressionListItem,
  ExpressionPage,
  ExpressionProgress,
  PracticeExpression,
  PracticeSession,
} from '@/types/expression';

export const progress = (over: Partial<ExpressionProgress> = {}): ExpressionProgress => ({
  recognitionScore: 0,
  recallScore: 0,
  contextScore: 0,
  transformationScore: 0,
  productionScore: 0,
  overallScore: 0.2,
  reviewCount: 1,
  correctCount: 1,
  incorrectCount: 0,
  masteryLevel: 'LEARNING',
  lastReviewedAt: null,
  nextReviewAt: null,
  ...over,
});

export const listItem = (
  n: number,
  over: Partial<ExpressionListItem> = {},
): ExpressionListItem => ({
  id: `e${n}`,
  expression: `ins Auge fassen ${n}`,
  level: 'C1',
  meaningDe: `etwas ins Auge fassen ${n}`,
  meaningEn: `to consider ${n}`,
  register: 'NEUTRAL_FORMAL',
  imageUrl: null,
  exampleSentence: null,
  masteryLevel: 'NEW',
  overallScore: 0,
  productionScore: 0,
  bookmarked: false,
  ...over,
});

export const page = (items: ExpressionListItem[], pageNo = 0, totalPages = 1): ExpressionPage => ({
  items,
  page: pageNo,
  size: 20,
  totalElements: items.length,
  totalPages,
});

export const makeExpression = (over: Partial<Expression> = {}): Expression => ({
  id: 'e1',
  type: 'REDEWENDUNG',
  expression: 'ins Auge fassen',
  level: 'C1',
  meaningDe: 'etwas planen oder erwägen',
  meaningEn: 'to consider something',
  meaningFa: 'در نظر گرفتن',
  literalMeaning: 'put something into the eye',
  figurativeMeaning: 'plan to do something',
  imageUrl: null,
  grammarNote: 'Akkusativ',
  usageNote: 'Eher formell.',
  register: 'NEUTRAL_FORMAL',
  commonMistakes: 'Nicht „ins Auge sehen“ verwechseln.',
  examples: [
    {
      id: 'x1',
      sentence: 'Wir fassen einen Umzug ins Auge.',
      translationEn: 'We are considering a move.',
      translationFa: 'ما در فکر نقل مکان هستیم.',
      context: 'EVERYDAY',
    },
  ],
  patterns: [
    {
      id: 'p1',
      pattern: 'etwas ins Auge fassen',
      grammarCase: 'Akkusativ',
      preposition: 'in',
      example: 'Er fasst das Ziel ins Auge.',
    },
  ],
  progress: progress(),
  bookmarked: false,
  ...over,
});

export const practiceItem = (
  n = 1,
  over: Partial<PracticeExpression> = {},
): PracticeExpression => ({
  expressionId: `e${n}`,
  type: 'REDEWENDUNG',
  expression: `ins Auge fassen ${n}`,
  level: 'C1',
  meaningDe: `planen ${n}`,
  meaningEn: `to consider ${n}`,
  meaningFa: '',
  grammarNote: 'Akkusativ',
  exampleSentence: 'Wir fassen es ins Auge.',
  maskedSentence: 'Wir ___ es ins Auge.',
  masteryLevel: 'NEW',
  isNew: true,
  warmupSteps: ['RECALL', 'CONTEXT'],
  contextQuestion: {
    id: `q${n}`,
    type: 'CONTEXT',
    format: 'MULTIPLE_CHOICE',
    prompt: 'Welche Situation passt?',
    options: [
      { id: 'o1', text: 'Ein Plan' },
      { id: 'o2', text: 'Ein Streit' },
    ],
  },
  completionQuestion: null,
  transformationQuestion: null,
  ...over,
});

export const session = (count = 1, over: Partial<PracticeExpression> = {}): PracticeSession => ({
  items: Array.from({ length: count }, (_, i) => practiceItem(i + 1, over)),
  newCount: count,
  reviewCount: 0,
});
