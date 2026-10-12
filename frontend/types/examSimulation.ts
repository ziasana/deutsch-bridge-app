import type { ExamPassagePublic, ExamQuestionPublic, ExamSection, ExamTaskType, SpeakingContent } from "./exam";

export type PartModule = "WRITTEN" | "ORAL";
export type PartScoringMethod = "PER_QUESTION" | "MANUAL_RUBRIC" | "UNSCORED";
export type TimerKind = "WORKING" | "PREPARATION";
export type AttemptStatus = "IN_PROGRESS" | "COMPLETED" | "EXPIRED" | "CANCELLED";
export type ProfileStatus = "DRAFT" | "PUBLISHED" | "DEACTIVATED" | "ARCHIVED";
export type AnswerReleasePolicy = "SCORE_ONLY" | "AFTER_SUBMISSION" | "AFTER_ASSESSMENT";
export type OverallResultPolicy = "WRITTEN_AND_ORAL_REQUIRED" | "WRITTEN_ONLY";
export type ResultStatus = "PASSED" | "NOT_PASSED" | "AWAITING_ASSESSMENT" | "NOT_ASSESSED" | "INCOMPLETE";
export type PartResultStatus = "SCORED" | "AWAITING_ASSESSMENT" | "NOT_SCORED";

export interface RubricCriterion {
    key: string;
    label: string;
    description?: string | null;
    maxPoints: number;
}

// ------------------------------------------------------------------ profile configuration (admin)

export interface ExamTimerConfig {
    key: string;
    label: string;
    minutes: number;
    kind: TimerKind | null;
    previewTimerKey: string | null;
}

export interface ExamPartConfig {
    key: string;
    label: string;
    module: PartModule;
    section: ExamSection;
    teil: number;
    taskTypes: ExamTaskType[] | null;
    exerciseCount: number;
    questionCount: number | null;
    pointsPerQuestion: number | null;
    maxPoints: number;
    scoringMethod: PartScoringMethod;
    timerKey: string;
    rubric: RubricCriterion[] | null;
    /** Plays allowed per audio clip (listening parts); null = unlimited. */
    maxAudioPlays?: number | null;
}

export interface ExamProfileConfig {
    parts: ExamPartConfig[];
    timers: ExamTimerConfig[];
    scoreScale: number | null;
    roundingMode: string | null;
}

export interface ExamProfileRequest {
    code: string;
    provider: string;
    examName: string;
    title: string;
    description: string | null;
    examType: string;
    level: string;
    oralScoringEnabled: boolean;
    writtenMaxPoints: number;
    writtenPassThreshold: number;
    oralMaxPoints: number;
    oralPassThreshold: number;
    overallResultPolicy: OverallResultPolicy;
    answerReleasePolicy: AnswerReleasePolicy;
    maxResumes: number | null;
    excludePracticedExercises: boolean;
    config: ExamProfileConfig;
}

export interface ExamProfileResponse extends ExamProfileRequest {
    id: string;
    version: number;
    status: ProfileStatus;
    editable: boolean;
    totalMaxPoints: number;
    verificationNote: string | null;
    sourceProfileId: string | null;
    createdAt: string;
    createdBy: string | null;
    updatedAt: string | null;
    updatedBy: string | null;
    publishedAt: string | null;
    publishedBy: string | null;
}

export interface ValidationIssue {
    code: string;
    path: string;
    message: string;
}

export interface ValidationResponse {
    valid: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
}

export interface PartAvailability {
    partKey: string;
    label: string;
    required: number;
    eligible: number;
    unusedForUser: number;
    minRemainingAcrossUsers: number;
}

export interface AvailabilityResponse {
    profileId: string;
    parts: PartAvailability[];
    sufficient: boolean;
}

// ------------------------------------------------------------------ overview

export interface PartOverview {
    key: string;
    label: string;
    module: PartModule;
    section: ExamSection;
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
    blockedReason: "ACTIVE_ATTEMPT" | "PROFILE_INVALID" | "INSUFFICIENT_CONTENT" | null;
    activeAttemptId: string | null;
    best: AttemptSummary | null;
    latest: AttemptSummary | null;
    attemptCount: number;
}

// ------------------------------------------------------------------ active exam

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
    section: ExamSection;
    teil: number;
    maxPoints: number;
    scoringMethod: PartScoringMethod;
    previewOnly: boolean;
    maxAudioPlays: number | null;
    /** Plays already used per passage id (counted by the server). */
    audioPlays: Record<string, number>;
    exercises: ExercisePublic[];
}

export type StageStatusName = "PENDING" | "RUNNING" | "COMPLETED" | "EXPIRED";

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
    answers: Record<string, Record<string, SavedAnswer>>;
    progress: PartProgress[];
    resumeCount: number;
    maxResumes: number | null;
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

// ------------------------------------------------------------------ results

export interface PartResult {
    key: string;
    label: string;
    module: PartModule;
    section: ExamSection;
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
    speaking: SpeakingContent | null;
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

// ------------------------------------------------------------------ admin

export interface AdminAttemptRow {
    id: string;
    userId: string;
    profileCode: string;
    profileVersion: number;
    status: AttemptStatus;
    startedAtMs: number;
    endedAtMs: number | null;
    overallResult: ResultStatus | null;
    awaitingAssessment: boolean;
}

export interface AssessmentQueueItem {
    assessmentId: string;
    attemptId: string;
    userId: string;
    partKey: string;
    partLabel: string;
    module: PartModule;
    submittedAtMs: number;
    maxPoints: number;
    rubric: RubricCriterion[];
    submittedText: string | null;
    completed: boolean;
    /** Unofficial AI feedback; never counted into a score. */
    aiEstimate: string | null;
}

export interface AudioPlayResponse {
    partKey: string;
    passageId: string;
    playsUsed: number;
    playsRemaining: number | null;
}

export interface AuditEntry {
    id: string;
    action: string;
    fromState: string | null;
    toState: string | null;
    actor: string | null;
    occurredAt: string;
}

/** Error body of the exam simulation API (HTTP 4xx). */
export interface ExamSimulationError {
    message: string;
    status: number;
    code?: string;
    details?: Record<string, unknown>;
}
