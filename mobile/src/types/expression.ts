export type ExpressionType = 'NOMEN_VERB_VERBINDUNG' | 'REDEWENDUNG';
export type ExpressionRegister = 'NEUTRAL_FORMAL' | 'FORMAL' | 'UMGANGSSPRACHLICH';
export type ExpressionExampleContext = 'EVERYDAY' | 'WORK' | 'UNIVERSITY' | 'SOCIETY' | 'EXAM';
export type ExpressionMasteryLevel = 'NEW' | 'LEARNING' | 'FAMILIAR' | 'ACTIVE' | 'MASTERED';
export type ExpressionQuestionType = 'CONTEXT' | 'COMPLETION' | 'TRANSFORMATION';
export type ExpressionQuestionFormat = 'MULTIPLE_CHOICE' | 'FREE_TEXT';
export type ExpressionSort = 'recommended' | 'progress' | 'alphabetical';

export interface ExpressionExample {
  id: string;
  sentence: string;
  translationEn: string;
  translationFa: string;
  context: ExpressionExampleContext;
}

export interface ExpressionPattern {
  id: string;
  pattern: string;
  grammarCase: string;
  preposition: string;
  example: string;
}

export interface ExpressionProgress {
  recognitionScore: number;
  recallScore: number;
  contextScore: number;
  transformationScore: number;
  productionScore: number;
  overallScore: number;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  masteryLevel: ExpressionMasteryLevel;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
}

export interface Expression {
  id: string;
  type: ExpressionType;
  expression: string;
  level: string;
  meaningDe: string;
  meaningEn: string;
  meaningFa: string;
  literalMeaning: string;
  figurativeMeaning: string;
  /** Relative "/uploads/…" URL; only meaningful for REDEWENDUNG. */
  imageUrl: string | null;
  grammarNote: string;
  usageNote: string;
  register: ExpressionRegister | null;
  commonMistakes: string;
  examples: ExpressionExample[];
  patterns: ExpressionPattern[];
  progress: ExpressionProgress | null;
  bookmarked: boolean;
}

/** Light list row; masteryLevel/overallScore/bookmarked are per-user. */
export interface ExpressionListItem {
  id: string;
  expression: string;
  level: string;
  meaningDe: string;
  meaningEn: string;
  register: ExpressionRegister | null;
  imageUrl: string | null;
  exampleSentence: string | null;
  masteryLevel: ExpressionMasteryLevel;
  overallScore: number;
  productionScore: number;
  bookmarked: boolean;
}

export interface ExpressionPage {
  items: ExpressionListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ExpressionCollectionSummary {
  type: ExpressionType;
  total: number;
}

export interface ExpressionContinueLearning {
  items: ExpressionListItem[];
  readyCount: number;
}

export interface ExpressionNavigation {
  previous: { id: string; expression: string } | null;
  next: { id: string; expression: string } | null;
}

export interface ExpressionFilters {
  level: string; // 'ALL' or A1..C2
  progress: string; // 'ALL' or a mastery level
  bookmarked: boolean;
  sort: ExpressionSort;
  search: string;
}

// ---- practice ----

export interface PracticeQuestionOption {
  id: string;
  text: string;
}

export interface PracticeQuestion {
  id: string;
  type: ExpressionQuestionType;
  format: ExpressionQuestionFormat;
  prompt: string;
  options: PracticeQuestionOption[];
}

export type WarmupStep = 'RECALL' | 'CONTEXT' | 'COMPLETION' | 'TRANSFORMATION';

export interface PracticeExpression {
  expressionId: string;
  type: ExpressionType;
  expression: string;
  level: string;
  meaningDe: string;
  meaningEn: string;
  meaningFa: string;
  grammarNote: string;
  exampleSentence: string | null;
  maskedSentence: string | null;
  masteryLevel: ExpressionMasteryLevel;
  isNew: boolean;
  warmupSteps: WarmupStep[];
  contextQuestion: PracticeQuestion | null;
  completionQuestion: PracticeQuestion | null;
  transformationQuestion: PracticeQuestion | null;
}

export interface PracticeSession {
  items: PracticeExpression[];
  newCount: number;
  reviewCount: number;
}

export interface RecallAnswerResponse {
  correct: boolean;
  correctAnswer: string;
  progress: ExpressionProgress;
}

export interface QuestionAnswerResponse {
  correct: boolean;
  correctOptionId: string | null;
  explanation: string | null;
  progress: ExpressionProgress;
}

export interface TransformationAnswerResponse {
  usedExpression: boolean;
  grammarCorrect: boolean;
  meaningPreserved: boolean;
  feedback: string;
  c1Suggestion: string | null;
  progress: ExpressionProgress;
}

export interface ProductionAnswerResponse {
  usedCorrectly: boolean;
  grammarCorrect: boolean;
  natural: boolean;
  feedback: string;
  c1Suggestion: string | null;
  progress: ExpressionProgress;
}
