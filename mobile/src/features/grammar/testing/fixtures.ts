import type {
  CategoryTestStatus,
  GrammarCategoryWithLessons,
  GrammarLesson,
  GrammarLessonSummary,
  GrammarLevelView,
  QuizQuestion,
} from '@/types/grammar';

export const mcq = (n: number): QuizQuestion => ({
  type: 'mcq',
  title: `Aufgabe ${n}`,
  question: `Frage ${n}: Ich ___ müde.`,
  options: ['bin', 'habe', 'werde'],
  answer: 'bin',
  titleFa: null,
  questionFa: null,
});

export const fill = (): QuizQuestion => ({
  type: 'fill',
  title: 'Lücke',
  question: 'Du ___ hier.',
  answer: 'bist',
});
export const trueFalse = (): QuizQuestion => ({
  type: 'truefalse',
  title: 'Stimmt das?',
  question: 'Haben ist ein Hilfsverb.',
  answer: true,
});
export const broken = (): QuizQuestion => ({
  type: 'mcq',
  title: '',
  question: 'Kaputt',
  options: ['a'],
  answer: 'zzz',
});

export const notAttempted: CategoryTestStatus = {
  attempted: false,
  score: 0,
  total: 0,
  passed: false,
  completed: false,
  passThreshold: 70,
};

export const makeLesson = (over: Partial<GrammarLesson> = {}): GrammarLesson => ({
  id: 'l1',
  title: 'Das Perfekt',
  summary: 'Vergangenheit im Alltag',
  content:
    '## Regel\n\nDas Perfekt bildet man mit **haben** oder *sein*.\n\n| Person | Form |\n|---|---|\n| ich | habe |',
  level: 'A2',
  example: 'Ich **habe** gegessen.',
  usageTips: 'Im Alltag benutzt man das Perfekt.',
  titleFa: null,
  summaryFa: null,
  contentFa: null,
  exampleFa: null,
  usageTipsFa: null,
  videoLink: null,
  quiz: [mcq(1), fill(), trueFalse()],
  learningProgresses: [],
  categoryId: 'c1',
  categoryTitle: 'Vergangenheit',
  sortOrder: 1,
  bookmarked: false,
  ...over,
});

export const makeSummary = (
  id: string,
  over: Partial<GrammarLessonSummary> = {},
): GrammarLessonSummary => ({
  id,
  title: `Lektion ${id}`,
  titleFa: null,
  summary: `Zusammenfassung ${id}`,
  summaryFa: null,
  level: 'A2',
  quizCount: 3,
  learned: false,
  bookmarked: false,
  ...over,
});

export const makeLevelView = (): GrammarLevelView => ({
  level: 'A2',
  categories: [
    {
      id: 'c1',
      title: 'Vergangenheit',
      titleFa: null,
      level: 'A2',
      sortOrder: 1,
      passThreshold: 70,
      lessons: [makeSummary('l1', { learned: true }), makeSummary('l2')],
      testStatus: notAttempted,
    },
    {
      id: 'c2',
      title: 'Artikel',
      titleFa: null,
      level: 'A2',
      sortOrder: 2,
      passThreshold: 70,
      lessons: [makeSummary('l3', { quizCount: 0 })],
      testStatus: { ...notAttempted, attempted: true, score: 8, total: 10, passed: true },
    },
  ],
  uncategorized: [makeSummary('u1')],
});

export const makeCategory = (): GrammarCategoryWithLessons => ({
  id: 'c1',
  title: 'Vergangenheit',
  titleFa: null,
  level: 'A2',
  sortOrder: 1,
  passThreshold: 70,
  lessons: [
    makeLesson({ id: 'l1', quiz: [mcq(1), mcq(2)] }),
    makeLesson({ id: 'l2', quiz: [mcq(3), broken()] }),
  ],
  testStatus: notAttempted,
});
