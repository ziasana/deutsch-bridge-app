import type {
  ExamExercise,
  ExamExerciseSummary,
  ExamPassagePublic,
  ExamQuestionPublic,
} from '@/types/exam';

export const summary = (
  id: string,
  over: Partial<ExamExerciseSummary> = {},
): ExamExerciseSummary => ({
  id,
  title: `Übung ${id}`,
  section: 'LESEVERSTEHEN',
  taskType: 'MATCHING',
  level: 'B1',
  partNumber: 1,
  teil: 1,
  teilDescription: null,
  questionsCount: 3,
  completed: false,
  lastScore: null,
  bookmarked: false,
  ...over,
});

export const passage = (id: string, over: Partial<ExamPassagePublic> = {}): ExamPassagePublic => ({
  id,
  label: id.toUpperCase(),
  content: `Text ${id}`,
  imageUrl: null,
  audioUrl: null,
  ...over,
});

export const question = (id: string, over: Partial<ExamQuestionPublic> = {}): ExamQuestionPublic => ({
  id,
  taskType: 'MULTIPLE_CHOICE',
  prompt: `Frage ${id}`,
  sectionIndex: null,
  options: ['Ja', 'Nein'],
  gapNumber: null,
  questionNumber: null,
  ...over,
});

export const exercise = (over: Partial<ExamExercise> = {}): ExamExercise => ({
  id: 'e1',
  title: '1. Übung',
  section: 'LESEVERSTEHEN',
  taskType: 'MULTIPLE_CHOICE',
  level: 'B1',
  partNumber: 2,
  teil: 2,
  passages: [passage('p1')],
  questions: [question('q1'), question('q2')],
  answerOptions: null,
  answerOptionLabels: null,
  teilDescription: null,
  modelSolution: null,
  requiresPlanning: false,
  leitpunkte: null,
  defaultExplanation: null,
  defaultCommonMistake: null,
  completed: false,
  lastScore: null,
  bookmarked: false,
  ...over,
});
