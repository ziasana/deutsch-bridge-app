import type { QuizQuestion } from '@/types/grammar';
import { pickInitialLevel } from '@/utils/levels';
import { buildRows, learnedIn } from '../GrammarListScreen';
import {
  isCorrectAnswer,
  isLessonLearned,
  isPlayableQuestion,
  lessonQuestions,
  localizedHeading,
  localizedLesson,
  localizedQuestion,
  questionKey,
} from '../quiz';
import { broken, fill, makeLesson, makeLevelView, mcq, trueFalse } from '../testing/fixtures';

describe('answer checking', () => {
  it('ignores case and surrounding spaces', () => {
    expect(isCorrectAnswer(mcq(1), ' BIN ')).toBe(true);
    expect(isCorrectAnswer(mcq(1), 'habe')).toBe(false);
    expect(isCorrectAnswer(fill(), 'Bist')).toBe(true);
  });

  it('handles true/false with boolean answers', () => {
    expect(isCorrectAnswer(trueFalse(), 'True')).toBe(true);
    expect(isCorrectAnswer(trueFalse(), 'False')).toBe(false);
    expect(isCorrectAnswer({ ...trueFalse(), answer: false }, 'false')).toBe(true);
  });
});

describe('isPlayableQuestion', () => {
  it('accepts well-formed questions and rejects broken ones', () => {
    expect(isPlayableQuestion(mcq(1))).toBe(true);
    expect(isPlayableQuestion(fill())).toBe(true);
    expect(isPlayableQuestion(trueFalse())).toBe(true);
    expect(isPlayableQuestion(broken())).toBe(false);
    expect(isPlayableQuestion({ ...mcq(1), question: '  ' })).toBe(false);
    expect(isPlayableQuestion({ ...fill(), answer: '' })).toBe(false);
    expect(isPlayableQuestion({ ...mcq(1), options: ['bin'] })).toBe(false);
    expect(isPlayableQuestion({ type: 'other' } as unknown as QuizQuestion)).toBe(false);
  });

  it('keeps original indices so saved progress keys stay stable', () => {
    const lesson = makeLesson({ quiz: [broken(), mcq(2), fill()] });
    expect(lessonQuestions(lesson).map((q) => q.index)).toEqual([1, 2]);
    expect(questionKey('l1', 2)).toBe('l1:2');
  });
});

describe('Persian localization', () => {
  const lesson = makeLesson({
    level: 'A2',
    titleFa: 'ماضی',
    summaryFa: 'خلاصه',
    contentFa: 'متن',
    exampleFa: null,
  });

  it('uses Persian only for translatable levels and when a value exists', () => {
    expect(localizedHeading(lesson, true)).toEqual({ title: 'ماضی', summary: 'خلاصه', dir: 'rtl' });
    expect(localizedHeading(lesson, false).title).toBe('Das Perfekt');
    expect(localizedHeading({ ...lesson, level: 'B2' }, true).title).toBe('Das Perfekt'); // B2+ stays German
    const text = localizedLesson(lesson, true);
    expect(text.content).toBe('متن');
    expect(text.example).toBe(lesson.example); // no Persian example → falls back
  });

  it('localizes question text but never the options or answer', () => {
    const q = { ...mcq(1), questionFa: 'سوال' };
    expect(localizedQuestion(q, 'A1', true)).toMatchObject({ question: 'سوال', dir: 'rtl' });
    expect(localizedQuestion(q, 'C1', true).question).toBe(q.question);
  });

  it('detects learned state', () => {
    expect(isLessonLearned(makeLesson())).toBe(false);
    expect(isLessonLearned(makeLesson({ learningProgresses: [{ id: 'x', learned: true }] }))).toBe(
      true,
    );
  });
});

describe('list building', () => {
  const view = makeLevelView();

  it('collapses categories by default and expands lessons plus a test row on demand', () => {
    expect(buildRows(view.categories, view.uncategorized, {}).map((r) => r.kind)).toEqual([
      'category',
      'category',
      'heading',
      'lesson',
    ]);
    const open = buildRows(view.categories, view.uncategorized, { c1: true });
    expect(open.map((r) => r.kind)).toEqual([
      'category',
      'lesson',
      'lesson',
      'test',
      'category',
      'heading',
      'lesson',
    ]);
  });

  it('offers no test row for categories without quizzes', () => {
    expect(buildRows(view.categories, [], { c2: true }).some((r) => r.kind === 'test')).toBe(false);
  });

  it('counts learned lessons', () => expect(learnedIn(view.categories[0].lessons)).toBe(1));

  it('picks the learner level when available, else the first level with content', () => {
    const summaries = [
      { level: 'A1', total: 0, learned: 0 },
      { level: 'A2', total: 5, learned: 1 },
      { level: 'B1', total: 3, learned: 0 },
    ];
    expect(pickInitialLevel('B1', summaries)).toBe('B1');
    expect(pickInitialLevel('C1', summaries)).toBe('A2');
    expect(pickInitialLevel('null', summaries)).toBe('A2');
    expect(pickInitialLevel(null, [])).toBeNull();
  });
});
