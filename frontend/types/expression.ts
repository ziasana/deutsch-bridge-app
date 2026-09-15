export type ExpressionType = "NOMEN_VERB_VERBINDUNG" | "REDEWENDUNG";
export type ExpressionStatus = "DRAFT" | "PUBLISHED";
export type ExpressionRegister = "NEUTRAL_FORMAL" | "FORMAL" | "UMGANGSSPRACHLICH";
export type ExpressionExampleContext = "EVERYDAY" | "WORK" | "UNIVERSITY" | "SOCIETY" | "EXAM";
export type ExpressionMasteryLevel = "NEW" | "LEARNING" | "FAMILIAR" | "ACTIVE" | "MASTERED";
export type ExpressionQuestionType = "CONTEXT" | "COMPLETION" | "TRANSFORMATION";
export type ExpressionQuestionFormat = "MULTIPLE_CHOICE" | "FREE_TEXT";

export interface ExpressionExample {
  id: string;
  sentence: string;
  translationEn: string;
  translationFa: string;
  context: ExpressionExampleContext;
}

export interface ExpressionExampleInput {
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

export interface ExpressionPatternInput {
  pattern: string;
  grammarCase: string;
  preposition: string;
  example: string;
}

export interface ExpressionQuestionOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface ExpressionQuestionOptionInput {
  text: string;
  correct: boolean;
}

export interface ExpressionQuestion {
  id: string;
  type: ExpressionQuestionType;
  format: ExpressionQuestionFormat;
  prompt: string;
  explanation: string;
  options: ExpressionQuestionOption[];
}

export interface ExpressionQuestionInput {
  type: ExpressionQuestionType;
  format: ExpressionQuestionFormat;
  prompt: string;
  explanation: string;
  options: ExpressionQuestionOptionInput[];
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
  grammarNote: string;
  usageNote: string;
  register: ExpressionRegister | null;
  commonMistakes: string;
  status: ExpressionStatus;
  examples: ExpressionExample[];
  patterns: ExpressionPattern[];
  /** Admin-only - always null for students, even on their own detail-page fetch (see backend ExpressionMapper). */
  questions: ExpressionQuestion[] | null;
  progress: ExpressionProgress | null;
}

export interface ExpressionManualRequest {
  expression: string;
  type: ExpressionType;
  level: string;
  meaningDe: string;
  meaningEn: string;
  meaningFa: string;
  literalMeaning: string;
  figurativeMeaning: string;
  grammarNote: string;
  usageNote: string;
  register: ExpressionRegister | null;
  commonMistakes: string;
  status: ExpressionStatus;
  examples: ExpressionExampleInput[];
  patterns: ExpressionPatternInput[];
  questions: ExpressionQuestionInput[];
}

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
  warmupSteps: ("RECALL" | "CONTEXT" | "COMPLETION" | "TRANSFORMATION")[];
  contextQuestion: PracticeQuestion | null;
  completionQuestion: PracticeQuestion | null;
  transformationQuestion: PracticeQuestion | null;
}

export interface PracticeSession {
  items: PracticeExpression[];
  newCount: number;
  reviewCount: number;
}

export interface RecallAnswerRequest {
  expressionId: string;
  userAnswer: string;
}

export interface RecallAnswerResponse {
  correct: boolean;
  correctAnswer: string;
  progress: ExpressionProgress;
}

export interface ProductionAnswerRequest {
  expressionId: string;
  sentence: string;
}

export interface ProductionAnswerResponse {
  usedCorrectly: boolean;
  grammarCorrect: boolean;
  natural: boolean;
  feedback: string;
  c1Suggestion: string | null;
  progress: ExpressionProgress;
}

export interface QuestionAnswerRequest {
  expressionId: string;
  questionId: string;
  selectedOptionId: string;
}

export interface QuestionAnswerResponse {
  correct: boolean;
  correctOptionId: string | null;
  explanation: string | null;
  progress: ExpressionProgress;
}

export interface TransformationAnswerRequest {
  expressionId: string;
  questionId: string;
  sentence: string;
}

export interface TransformationAnswerResponse {
  usedExpression: boolean;
  grammarCorrect: boolean;
  meaningPreserved: boolean;
  feedback: string;
  c1Suggestion: string | null;
  progress: ExpressionProgress;
}
