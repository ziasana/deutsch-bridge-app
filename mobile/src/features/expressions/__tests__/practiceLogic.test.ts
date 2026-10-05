import {
  computeSteps,
  initialPractice,
  meaningLine,
  practiceReducer,
  questionForStep,
  sentenceOutcome,
  summarize,
  type PracticeAction,
} from '../practiceLogic';
import { practiceItem } from '../testing/fixtures';

const done = (
  outcome: boolean | null,
  stepCount: number,
  itemCount: number,
  isProduction = false,
): PracticeAction => ({
  type: 'STEP_DONE',
  outcome,
  stepCount,
  itemCount,
  expression: 'ins Auge fassen',
  isProduction,
});

describe('computeSteps', () => {
  const item = practiceItem(1, { warmupSteps: ['RECALL', 'CONTEXT', 'TRANSFORMATION'] });

  it('adds discover first unless skipped, and production last', () => {
    expect(computeSteps(item, false)).toEqual([
      'discover',
      'recall',
      'context',
      'transformation',
      'production',
    ]);
    expect(computeSteps(item, true)).toEqual(['recall', 'context', 'transformation', 'production']);
    expect(computeSteps(practiceItem(1, { warmupSteps: [] }), true)).toEqual(['production']);
  });

  it('finds the question for a step', () => {
    expect(questionForStep(item, 'context')?.id).toBe('q1');
    expect(questionForStep(item, 'completion')).toBeNull();
    expect(questionForStep(item, 'recall')).toBeNull();
  });
});

describe('practiceReducer', () => {
  it('records judged outcomes, ignores null ones, and finishes an expression on its last step', () => {
    let s = practiceReducer(initialPractice, done(null, 3, 2)); // discover
    expect(s).toMatchObject({ stepIndex: 1, outcomes: [] });
    s = practiceReducer(s, done(true, 3, 2)); // recall
    expect(s.outcomes).toEqual([true]);
    s = practiceReducer(s, done(false, 3, 2, true)); // production (last)
    expect(s).toMatchObject({ itemIndex: 1, stepIndex: 0, outcomes: [], done: false });
    expect(s.results).toEqual([
      { expression: 'ins Auge fassen', correctSteps: 1, totalSteps: 2, productionCorrect: false },
    ]);
  });

  it('completes the session after the last expression', () => {
    const s = practiceReducer(initialPractice, done(true, 1, 1, true));
    expect(s.done).toBe(true);
    expect(s.results[0]).toMatchObject({ correctSteps: 1, totalSteps: 1, productionCorrect: true });
  });

  it('a skipped production step leaves productionCorrect null', () => {
    const s = practiceReducer(initialPractice, done(null, 1, 1, true));
    expect(s.results[0]).toMatchObject({ totalSteps: 0, productionCorrect: null });
  });
});

describe('summaries and helpers', () => {
  it('summarizes accuracy and strong / needs-practice lists', () => {
    const r = summarize([
      { expression: 'A', correctSteps: 3, totalSteps: 3, productionCorrect: true },
      { expression: 'B', correctSteps: 1, totalSteps: 3, productionCorrect: false },
      { expression: 'C', correctSteps: 0, totalSteps: 0, productionCorrect: null },
    ]);
    expect(r).toMatchObject({
      expressions: 3,
      correct: 4,
      total: 6,
      percent: 67,
      productionCorrect: 1,
      productionTotal: 2,
      strong: ['A'],
      needsPractice: ['B'],
    });
    expect(summarize([]).percent).toBe(0);
  });

  it('judges sentence steps and builds meaning lines', () => {
    expect(sentenceOutcome(true, true)).toBe(true);
    expect(sentenceOutcome(true, false)).toBe(false);
    expect(meaningLine('planen', 'to plan')).toBe('planen · to plan');
    expect(meaningLine('', 'to plan')).toBe('to plan');
    expect(meaningLine(null, null)).toBe('');
  });
});
