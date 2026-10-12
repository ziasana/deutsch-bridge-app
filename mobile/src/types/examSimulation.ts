import type { ExamPassagePublic, ExamQuestionPublic, ExamTaskType } from './exam';

// Learner-facing part of the exam simulation API (mirrors frontend/types/examSimulation.ts).

export type SimSection =
  | 'LESEVERSTEHEN'
  | 'SPRACHBAUSTEINE'
  | 'HOERVERSTEHEN'
  | 'SCHRIFTLICHER_AUSDRUCK'
  | 'MUENDLICHER_AUSDRUCK'
  | 'TESTFORMAT_INFORMATION';

export type PartModule = 'WRITTEN' | 'ORAL';
export type PartScoringMethod = 'PER_QUESTION' | 'MANUAL_RUBRIC' | 'UNSCORED';
export type TimerKind = 'WORKING' | 'PREPARATION';
export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
export type AnswerReleasePolicy = 'SCORE_ONLY' | 'AFTER_SUBMISSION' | 'AFTER_ASSESSMENT';
export type ResultStatus =
  | 'PASSED'
  | 'NOT_PASSED'
  | 'AWAITING_ASSESSMENT'
  | 'NOT_ASSESSED'
  | 'INCOMPLETE';
export type PartResultStatus = 'SCORED' | 'AWAITING_ASSESSMENT' | 'NOT_SCORED';

export interface RubricCriterion {
  key: string;
  label: string;
  description?: string | null;
  maxPoints: number;
}

export interface PartOverview {
  key: string;
  label: string;
  module: PartModule;
  section: SimSection;
  teil: number;
  questionCount: number;
  pointsPerQuestion: number | null;
  maxPoints: number;
  scoringMethod: PartScoringMethod;
  stageKey: string;
  rubric: RubricCriterion[];
  required: number;
  eligible: number;
  unused: number;
}

export interface StageOverview {
  key: string;
  label: string;
  minutes: number;
  kind: TimerKind;
  partKeys: string[];
}

export interface AttemptSummary {
  id: string;
  status: AttemptStatus;
  profileVersion: number;
  profileTitle: string;
  startedAtMs: number;
  endedAtMs: number | null;
  durationSeconds: number | null;
  writtenScore: number | null;
  writtenMax: number | null;
  writtenPercentage: number | null;
  writtenComplete: boolean;
  writtenResult: ResultStatus | null;
  oralResult: ResultStatus | null;
  overallResult: ResultStatus | null;
  totalScore: number | null;
  totalMax: number | null;
  awaitingAssessment: boolean;
}

export type BlockedReason = 'ACTIVE_ATTEMPT' | 'PROFILE_INVALID' | 'INSUFFICIENT_CONTENT';

export interface ProfileOverview {
  id: string;
  code: string;
  version: number;
  provider: string;
  examName: string;
  title: string;
  description: string | null;
  level: string;
  oralScoringEnabled: boolean;
  writtenMaxPoints: number;
  writtenPassThreshold: number;
  oralMaxPoints: number;
  oralPassThreshold: number;
  totalMaxPoints: number;
  answerReleasePolicy: AnswerReleasePolicy;
  totalMinutes: number;
  stages: StageOverview[];
  parts: PartOverview[];
  canStart: boolean;
  blockedReason: BlockedReason | null;
  activeAttemptId: string | null;
  activeAttemptPaused: boolean;
  best: AttemptSummary | null;
  latest: AttemptSummary | null;
  attemptCount: number;
}

export interface SpeakingTopic {
  id: string;
  title: string;
}

export interface SpeakingContent {
  taskType: string;
  topic: string | null;
  topics?: SpeakingTopic[];
  person?: { name: string | null; age: number | null; occupation: string | null } | null;
  opinionText?: string | null;
  scenario?: string | null;
  planningPoints?: { id: string; title: string; hint?: string | null }[];
}

export interface ExercisePublic {
  ordinal: number;
  title: string;
  taskType: ExamTaskType | null;
  teilDescription: string | null;
  passages: ExamPassagePublic[];
  questions: ExamQuestionPublic[];
  answerOptions: string[] | null;
  answerOptionLabels: string[] | null;
  requiresPlanning: boolean;
  leitpunkte: string[] | null;
  speaking: SpeakingContent | null;
}

export interface PartState {
  key: string;
  label: string;
  module: PartModule;
  section: SimSection;
  teil: number;
  maxPoints: number;
  scoringMethod: PartScoringMethod;
  previewOnly: boolean;
  maxAudioPlays: number | null;
  /** Plays already used per passage id (counted by the server). */
  audioPlays: Record<string, number>;
  exercises: ExercisePublic[];
}

export type StageStatusName = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'EXPIRED';

export interface StageStatus {
  index: number;
  key: string;
  label: string;
  minutes: number;
  kind: TimerKind;
  status: StageStatusName;
  startedAtMs: number | null;
  deadlineAtMs: number | null;
  partKeys: string[];
}

export interface SavedAnswer {
  answer: string | null;
  flagged: boolean;
}

export type AnswerMap = Record<string, Record<string, SavedAnswer>>;

export interface PartProgress {
  partKey: string;
  label: string;
  total: number;
  answered: number;
  flagged: number;
}

export interface AttemptState {
  attemptId: string;
  status: AttemptStatus;
  profileTitle: string;
  profileVersion: number;
  serverNowMs: number;
  startedAtMs: number;
  finalDeadlineMs: number;
  timeUp: boolean;
  currentStageIndex: number;
  remainingSeconds: number;
  stages: StageStatus[];
  parts: PartState[];
  answers: AnswerMap;
  progress: PartProgress[];
  resumeCount: number;
  maxResumes: number | null;
  paused: boolean;
  pausedAtMs: number | null;
  pauseCount: number;
}

export interface AnswerItem {
  partKey: string;
  questionId: string;
  answer: string | null;
  flagged: boolean;
  clientTs: number;
}

export interface SaveAnswersResponse {
  saved: number;
  rejected: { partKey: string; questionId: string; reason: string }[];
  status: AttemptStatus;
  serverNowMs: number;
  currentStageIndex: number;
  remainingSeconds: number;
  timeUp: boolean;
}

export interface AudioPlayResponse {
  partKey: string;
  passageId: string;
  playsUsed: number;
  playsRemaining: number | null;
}

export interface PartResult {
  key: string;
  label: string;
  module: PartModule;
  section: SimSection;
  teil: number;
  method: PartScoringMethod;
  maxPoints: number;
  score: number | null;
  status: PartResultStatus;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  completed: boolean;
  criteriaScores: Record<string, number> | null;
  assessorComment: string | null;
}

export interface ExamResult {
  writtenScore: number;
  writtenMax: number;
  writtenPercentage: number;
  writtenComplete: boolean;
  writtenPassThreshold: number;
  writtenResult: ResultStatus;
  oralScoringEnabled: boolean;
  oralScore: number | null;
  oralMax: number;
  oralPassThreshold: number;
  oralResult: ResultStatus;
  totalScore: number | null;
  totalMax: number;
  overallResult: ResultStatus;
  overallExplanation: string;
  parts: PartResult[];
  pendingAssessmentParts: string[];
  computedAtMs: number;
}

export interface ReviewQuestion {
  id: string;
  questionNumber: number | null;
  prompt: string | null;
  options: string[] | null;
  givenAnswer: string | null;
  correctAnswer: string | null;
  correct: boolean;
  explanation: string | null;
  commonMistake: string | null;
}

export interface ReviewExercise {
  ordinal: number;
  title: string;
  transcriptHtml: string | null;
  questions: ReviewQuestion[];
  writtenAnswer: string | null;
  modelSolution: string | null;
}

export interface ReviewPart {
  partKey: string;
  exercises: ReviewExercise[];
}

export interface ResultResponse {
  attemptId: string;
  status: AttemptStatus;
  finishReason: string | null;
  profileTitle: string;
  profileVersion: number;
  startedAtMs: number;
  endedAtMs: number | null;
  durationSeconds: number | null;
  result: ExamResult;
  rubrics: Record<string, RubricCriterion[]>;
  answersReleased: boolean;
  answerReleasePolicy: AnswerReleasePolicy;
  review: ReviewPart[];
}

export interface ProgressPoint {
  attemptId: string;
  endedAtMs: number;
  writtenScore: number | null;
  writtenPercentage: number | null;
  writtenComplete: boolean;
}

export interface HistoryResponse {
  attempts: AttemptSummary[];
  progress: ProgressPoint[];
}
