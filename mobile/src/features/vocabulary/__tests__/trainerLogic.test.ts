import { initialState, isWordCorrect, sessionPercent, summarize, trainerReducer, type TrainerState } from '../trainerLogic';
import { makeRound } from '../testing/fixtures';

const run = (actions: Parameters<typeof trainerReducer>[1][], from: TrainerState = initialState) =>
  actions.reduce(trainerReducer, from);

describe('trainerReducer', () => {
  it('walks a word with a context question: flip → grade → select → submitted → next', () => {
    let s = run([{ type: 'START' }, { type: 'FLIP' }]);
    expect(s).toMatchObject({ stage: 'flashcard', flipped: true });

    s = run([{ type: 'GRADE', knewIt: true, hasContext: true }], s);
    expect(s).toMatchObject({ stage: 'context', knewIt: true });

    s = run([{ type: 'SELECT', key: 'k1a' }, { type: 'SUBMITTED', round: makeRound() }], s);
    expect(s).toMatchObject({ stage: 'result', selectedKey: 'k1a' });
    expect(s.results).toHaveLength(1);

    s = run([{ type: 'NEXT', total: 2 }], s);
    expect(s).toMatchObject({ stage: 'flashcard', index: 1, flipped: false, knewIt: null, selectedKey: null, round: null });
    expect(s.results).toHaveLength(1);
  });

  it('flashcard-only rounds stay on the flashcard until the server answers', () => {
    const s = run([{ type: 'START' }, { type: 'FLIP' }, { type: 'GRADE', knewIt: false, hasContext: false }]);
    expect(s.stage).toBe('flashcard');
    expect(s.knewIt).toBe(false);
  });

  it('finishes after the last word and can restart', () => {
    const s = run([{ type: 'START' }, { type: 'SUBMITTED', round: makeRound() }, { type: 'NEXT', total: 1 }]);
    expect(s.stage).toBe('done');
    expect(run([{ type: 'RESTART' }], s)).toEqual(initialState);
  });
});

describe('summaries', () => {
  const results = [
    { flashcardCorrect: true, contextCorrect: true },
    { flashcardCorrect: true, contextCorrect: false },
    { flashcardCorrect: false, contextCorrect: null },
    { flashcardCorrect: true, contextCorrect: null },
  ];

  it('a word is right only if recall was right and context was not wrong', () => {
    expect(results.map(isWordCorrect)).toEqual([true, false, false, true]);
  });

  it('computes totals and accuracies, ignoring flashcard-only rounds for context', () => {
    expect(summarize(results)).toEqual({ total: 4, correct: 2, recallAccuracy: 75, contextAccuracy: 50, contextAsked: 2 });
    expect(summarize([])).toMatchObject({ total: 0, recallAccuracy: 0, contextAccuracy: 0 });
  });

  it('computes whole-session progress including the current word', () => {
    expect(sessionPercent({ ...initialState, stage: 'flashcard', index: 1 }, 4)).toBe(25);
    expect(sessionPercent({ ...initialState, stage: 'context', index: 1 }, 4)).toBe(38);
    expect(sessionPercent({ ...initialState, stage: 'result', index: 1 }, 4)).toBe(50);
    expect(sessionPercent(initialState, 0)).toBe(0);
  });
});
