import type { VocabularyMasteryLevel, VocabularyRoundResponse } from '@/types/vocabulary';

export type Stage = 'intro' | 'flashcard' | 'context' | 'result' | 'done';

export type ItemResult = { flashcardCorrect: boolean; contextCorrect: boolean | null };

export type TrainerState = {
  stage: Stage;
  index: number;
  flipped: boolean;
  /** Self-grade of the flashcard for the current word (null until graded). */
  knewIt: boolean | null;
  selectedKey: string | null;
  /** The server's verdict for the current word, once the round is submitted. */
  round: VocabularyRoundResponse | null;
  results: ItemResult[];
};

export type TrainerAction =
  | { type: 'START' }
  | { type: 'FLIP' }
  | { type: 'GRADE'; knewIt: boolean; hasContext: boolean }
  | { type: 'SELECT'; key: string }
  | { type: 'SUBMITTED'; round: VocabularyRoundResponse }
  | { type: 'NEXT'; total: number }
  | { type: 'RESTART' };

export const initialState: TrainerState = {
  stage: 'intro',
  index: 0,
  flipped: false,
  knewIt: null,
  selectedKey: null,
  round: null,
  results: [],
};

const freshItem = {
  stage: 'flashcard',
  flipped: false,
  knewIt: null,
  selectedKey: null,
  round: null,
} as const;

export function trainerReducer(state: TrainerState, action: TrainerAction): TrainerState {
  switch (action.type) {
    case 'START':
      return { ...initialState, stage: 'flashcard' };
    case 'RESTART':
      return initialState;
    case 'FLIP':
      return { ...state, flipped: !state.flipped };
    case 'GRADE':
      // With a context question the round is submitted after it; otherwise the caller submits now.
      return {
        ...state,
        knewIt: action.knewIt,
        stage: action.hasContext ? 'context' : state.stage,
      };
    case 'SELECT':
      return { ...state, selectedKey: action.key };
    case 'SUBMITTED':
      return {
        ...state,
        stage: 'result',
        round: action.round,
        results: [
          ...state.results,
          {
            flashcardCorrect: action.round.flashcardCorrect,
            contextCorrect: action.round.contextCorrect,
          },
        ],
      };
    case 'NEXT':
      return state.index + 1 >= action.total
        ? { ...state, stage: 'done' }
        : { ...state, ...freshItem, index: state.index + 1 };
    default:
      return state;
  }
}

/** A word counts as "right" when the self-grade was right and the context question wasn't answered wrongly. */
export const isWordCorrect = (r: ItemResult) => r.flashcardCorrect && r.contextCorrect !== false;

export function summarize(results: ItemResult[]) {
  const total = results.length;
  const correct = results.filter(isWordCorrect).length;
  const contextAsked = results.filter((r) => r.contextCorrect !== null);
  const percent = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
  return {
    total,
    correct,
    recallAccuracy: percent(results.filter((r) => r.flashcardCorrect).length, total),
    contextAccuracy: percent(
      contextAsked.filter((r) => r.contextCorrect).length,
      contextAsked.length,
    ),
    contextAsked: contextAsked.length,
  };
}

/** Whole-session progress: finished words plus the share of the current word already answered. */
export function sessionPercent(state: TrainerState, total: number): number {
  if (total === 0) return 0;
  const partial = state.stage === 'result' ? 1 : state.stage === 'context' ? 0.5 : 0;
  return Math.round(((state.index + partial) / total) * 100);
}

export const MASTERY_LABEL: Record<VocabularyMasteryLevel, string> = {
  NEW: 'Neu',
  LEARNING: 'Am Lernen',
  FAMILIAR: 'Vertraut',
  MASTERED: 'Gemeistert',
};
