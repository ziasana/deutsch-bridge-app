import { ReactNode } from "react";

/** What a step receives from the lesson shell. */
export interface StepApi {
    /** True when the learner already finished this step earlier (they navigated back to it). */
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

/** Display data of one station of a learning path (Schreiben or Mündlicher Ausdruck). */
export interface LearnSectionMeta {
    id: string;
    label: string;
    emoji: string;
    hint: string;
}

export interface Station {
    id: string;
    steps: LessonStep[];
}
