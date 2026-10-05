import type { GrammarLesson, GrammarLessonSummary, QuizQuestion } from '@/types/grammar';

const normalize = (value: string) => value.trim().toLowerCase();

/** Levels whose lessons can carry a Persian translation; B2 and up stay single-language. */
export const TRANSLATABLE_LEVELS = ['A1', 'A2', 'B1'];
export const isTranslatableLevel = (level: string) => TRANSLATABLE_LEVELS.includes(level);

/** Whether `selected` is the right answer. Comparison ignores case and surrounding spaces. */
export function isCorrectAnswer(question: QuizQuestion, selected: string): boolean {
  if (typeof question.answer === 'boolean') {
    return normalize(selected) === (question.answer ? 'true' : 'false');
  }
  return normalize(selected) === normalize(question.answer);
}

/** Whether a question can actually be shown and answered. Broken ones are skipped, never crash. */
export function isPlayableQuestion(q: QuizQuestion): boolean {
  if (!q.question?.trim()) return false;
  switch (q.type) {
    case 'mcq': {
      const options = (q.options ?? []).map((o) => o.trim()).filter(Boolean);
      return (
        options.length >= 2 &&
        typeof q.answer === 'string' &&
        options.some((o) => normalize(o) === normalize(q.answer as string))
      );
    }
    case 'truefalse':
      return (
        typeof q.answer === 'boolean' ||
        ['true', 'false'].includes(normalize(String(q.answer ?? '')))
      );
    case 'fill':
      return typeof q.answer === 'string' && q.answer.trim() !== '';
    default:
      return false;
  }
}

/** Persian text applies only to translatable levels and only when a Persian value exists. */
const appliesPersian = (level: string, persian: boolean) => persian && isTranslatableLevel(level);

type Heading = Pick<GrammarLessonSummary, 'level' | 'title' | 'titleFa' | 'summary' | 'summaryFa'>;

export function localizedHeading(lesson: Heading, persian: boolean) {
  const fa = appliesPersian(lesson.level, persian);
  return {
    title: (fa && lesson.titleFa) || lesson.title,
    summary: (fa && lesson.summaryFa) || lesson.summary,
    dir: fa && lesson.titleFa ? ('rtl' as const) : ('ltr' as const),
  };
}

export function localizedLesson(lesson: GrammarLesson, persian: boolean) {
  const fa = appliesPersian(lesson.level, persian);
  return {
    ...localizedHeading(lesson, persian),
    content: (fa && lesson.contentFa) || lesson.content,
    example: (fa && lesson.exampleFa) || lesson.example,
    usageTips: (fa && lesson.usageTipsFa) || lesson.usageTips,
  };
}

export function localizedQuestion(question: QuizQuestion, level: string, persian: boolean) {
  const fa = appliesPersian(level, persian);
  return {
    title: (fa && question.titleFa) || question.title,
    question: (fa && question.questionFa) || question.question,
    dir: fa && question.questionFa ? ('rtl' as const) : ('ltr' as const),
  };
}

export const questionKey = (lessonId: string, index: number) => `${lessonId}:${index}`;
export const isLessonLearned = (lesson: Pick<GrammarLesson, 'learningProgresses'>) =>
  lesson.learningProgresses?.some((lp) => lp.learned) ?? false;

/** A runnable question keeps its place in the lesson quiz so progress keys stay stable. */
export type RunnerQuestion = {
  question: QuizQuestion;
  level: string;
  lessonId: string;
  index: number;
};

export function lessonQuestions(lesson: GrammarLesson): RunnerQuestion[] {
  return (lesson.quiz ?? [])
    .map((question, index) => ({ question, level: lesson.level, lessonId: lesson.id, index }))
    .filter((q) => isPlayableQuestion(q.question));
}

export const CATEGORY_TEST_MAX_QUESTIONS = 15;
