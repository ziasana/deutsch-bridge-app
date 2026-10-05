export type WritingGuideKind =
  | 'FORMAT'
  | 'STRATEGY_STEP'
  | 'STRUCTURE_PART'
  | 'EXAMPLE'
  | 'SENTENCE_PATTERN'
  | 'MISTAKE'
  | 'CHECKLIST_ITEM';

export type WritingFormality = 'INFORMAL' | 'NEUTRAL' | 'FORMAL';

export interface WritingStrategyData {
  tips?: string[];
}
export interface WritingExampleSection {
  key: string;
  label: string;
  text: string;
  why?: string;
  phrases?: string[];
}
export interface WritingExampleData {
  sections?: WritingExampleSection[];
}
export interface WritingMistakeData {
  wrong?: string;
  right?: string;
}

export interface WritingGuideItem<D = unknown> {
  id: string;
  kind: WritingGuideKind;
  title: string;
  content: string | null;
  data: D | null;
  sortOrder: number;
}

export interface WritingPhrase {
  id: string;
  /** Id of the Redemittel function (admin-managed, so any string). */
  category: string;
  categoryLabel: string;
  phrase: string;
  explanation: string | null;
  example: string | null;
  formality: WritingFormality | null;
  usageNote: string | null;
  sortOrder: number;
}

export interface WritingLearningResponse {
  level: string;
  items: WritingGuideItem[];
  phrases: WritingPhrase[];
}

/** How much help is available while writing. */
export type WritingMode = 'LEARN' | 'PRACTICE' | 'EXAM';
export type WritingHelpTab = 'TIP' | 'EXAMPLE' | 'PHRASES' | 'MISTAKES';

export interface WritingAttemptRequest {
  exerciseId: string;
  text: string;
  mode: WritingMode;
  planNotes?: string[];
  parentAttemptId?: string | null;
}

export type WritingFeedbackStatus = 'GOOD' | 'OK' | 'IMPROVE' | 'NOT_ASSESSED';

export interface WritingFeedbackDimension {
  key: 'TASK' | 'STRUCTURE' | 'LANGUAGE' | 'VOCABULARY' | 'FORM';
  title: string;
  status: WritingFeedbackStatus;
  positives: string[];
  improvements: string[];
}

/** Multi-dimensional feedback; intentionally no overall score. */
export interface WritingFeedback {
  source: string;
  dimensions: WritingFeedbackDimension[];
  highlights: string[];
  nextFocus: string[];
  stats: {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    connectorCount: number;
    usedPhrases: string[];
    uncoveredLeitpunkte: string[];
  };
}

export interface WritingAiFeedback {
  positives: string[];
  missingPoints: string[];
  grammar: { original: string; corrected: string; explanation: string }[];
  vocabulary: string[];
  structure: string[];
  improvementExample: string | null;
}

export interface WritingAttempt {
  id: string;
  exerciseId: string;
  mode: WritingMode;
  text: string;
  planNotes: string[];
  wordCount: number;
  attemptNumber: number;
  parentAttemptId: string | null;
  submittedAt: string;
  feedback: WritingFeedback | null;
  /** Present once the learner asked for AI feedback for this attempt. */
  aiFeedback: WritingAiFeedback | null;
}
