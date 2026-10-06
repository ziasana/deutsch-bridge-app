import type { ReactNode } from 'react';
import type { LearnSectionId } from '../writingMeta';

/** What a step receives from the lesson shell. */
export interface StepApi {
  /** True when the learner already finished this step (they navigated back to it). */
  solved: boolean;
  /** Report the step as done; pass a boolean to also count it in the lesson score (true = right first time). */
  complete: (correct?: boolean) => void;
}

export interface LessonStep {
  id: string;
  /** Gated steps block "Weiter" until they call complete(). */
  gated?: boolean;
  render: (api: StepApi) => ReactNode;
}

export interface Station {
  id: LearnSectionId;
  steps: LessonStep[];
}

export interface StationResult {
  correct: number;
  total: number;
}
