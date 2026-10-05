import type { PracticeExpression, PracticeQuestion } from '@/types/expression';

export type StepKey =
  'discover' | 'recall' | 'context' | 'completion' | 'transformation' | 'production';

/**
 * Steps for one expression: an optional "discover" (skipped when the learner just read the detail
 * page), the server's warm-up steps, and always a final production step.
 */
export function computeSteps(item: PracticeExpression, skipIntro: boolean): StepKey[] {
  const steps: StepKey[] = [];
  if (!skipIntro) steps.push('discover');
  for (const w of item.warmupSteps) steps.push(w.toLowerCase() as StepKey);
  steps.push('production');
  return steps;
}

export function questionForStep(item: PracticeExpression, step: StepKey): PracticeQuestion | null {
  if (step === 'context') return item.contextQuestion;
  if (step === 'completion') return item.completionQuestion;
  if (step === 'transformation') return item.transformationQuestion;
  return null;
}

export type ItemResult = {
  expression: string;
  correctSteps: number;
  totalSteps: number;
  /** null when production was skipped or never judged. */
  productionCorrect: boolean | null;
};

export type PracticeState = {
  itemIndex: number;
  stepIndex: number;
  /** Outcomes of the steps finished for the current expression (null outcomes are not recorded). */
  outcomes: boolean[];
  results: ItemResult[];
  done: boolean;
};

export const initialPractice: PracticeState = {
  itemIndex: 0,
  stepIndex: 0,
  outcomes: [],
  results: [],
  done: false,
};

export type PracticeAction = {
  type: 'STEP_DONE';
  /** true/false = judged right/wrong; null = informational or skipped step (not counted). */
  outcome: boolean | null;
  stepCount: number;
  itemCount: number;
  expression: string;
  /** Whether this step is the production step. */
  isProduction: boolean;
};

export function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  const outcomes = action.outcome === null ? state.outcomes : [...state.outcomes, action.outcome];
  if (state.stepIndex + 1 < action.stepCount) {
    return { ...state, stepIndex: state.stepIndex + 1, outcomes };
  }
  // Last step of this expression → record its result and move on.
  const result: ItemResult = {
    expression: action.expression,
    correctSteps: outcomes.filter(Boolean).length,
    totalSteps: outcomes.length,
    productionCorrect: action.isProduction && action.outcome !== null ? action.outcome : null,
  };
  const results = [...state.results, result];
  if (state.itemIndex + 1 >= action.itemCount) {
    return { ...state, outcomes: [], results, done: true };
  }
  return { itemIndex: state.itemIndex + 1, stepIndex: 0, outcomes: [], results, done: false };
}

export function summarize(results: ItemResult[]) {
  const correct = results.reduce((s, r) => s + r.correctSteps, 0);
  const total = results.reduce((s, r) => s + r.totalSteps, 0);
  const judged = results.filter((r) => r.productionCorrect !== null);
  return {
    expressions: results.length,
    correct,
    total,
    percent: total > 0 ? Math.round((correct / total) * 100) : 0,
    productionCorrect: judged.filter((r) => r.productionCorrect).length,
    productionTotal: judged.length,
    strong: results.filter((r) => r.productionCorrect).map((r) => r.expression),
    needsPractice: results.filter((r) => r.productionCorrect === false).map((r) => r.expression),
  };
}

/** An AI-judged sentence step counts as right only if it used the expression and the grammar was right. */
export const sentenceOutcome = (usedExpression: boolean, grammarCorrect: boolean) =>
  usedExpression && grammarCorrect;

/** Short meaning line for lists: German first, English as support. */
export const meaningLine = (de: string | null | undefined, en: string | null | undefined) =>
  [de, en].filter((s): s is string => !!s && s.trim() !== '').join(' · ');
