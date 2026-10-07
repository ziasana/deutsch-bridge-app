import type { PreferredLanguage } from '@/types/user';

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Reason =
  | 'WORK'
  | 'EVERYDAY_LIFE'
  | 'STUDY'
  | 'COMMUNICATION'
  | 'EXAM'
  | 'LIVING_IN_GERMANY'
  | 'PERSONAL_INTEREST';
export type Focus =
  | 'VOCABULARY'
  | 'GRAMMAR'
  | 'SPEAKING'
  | 'LISTENING'
  | 'READING'
  | 'WRITING'
  | 'EXPRESSIONS'
  | 'EXAM';
export type ExamKind = 'TELC' | 'GOETHE' | 'TESTDAF' | 'DSH' | 'OTHER';

/** Body of PUT /user/onboarding (mirrors the backend OnboardingRequest). */
export type OnboardingRequest = {
  preferredLanguage: PreferredLanguage;
  learningReasons: Reason[];
  currentLevel: Level | null;
  currentLevelUnknown: boolean;
  targetLevel: Level;
  dailyGoalWords: number;
  focusAreas: Focus[];
  examType: ExamKind | null;
  examLevel: Level | null;
  examDate: string | null;
};

export type StepId =
  'language' | 'reason' | 'currentLevel' | 'targetLevel' | 'dailyWords' | 'focus' | 'exam';

export type PlanState = {
  language: PreferredLanguage | null;
  reasons: Reason[];
  currentLevel: Level | null;
  currentLevelUnknown: boolean;
  targetLevel: Level | null;
  dailyWords: number | null;
  focus: Focus[];
  examType: ExamKind | null;
  examLevel: Level | null;
  hasExamDate: boolean;
  /** Raw "DD.MM.YYYY" text as typed. */
  examDateText: string;
};

export const MAX_FOCUS = 3;

export const LEVEL_ORDER: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** The target must lie above the current level (any level is fine when the current one is unknown). */
export function isTargetAllowed(
  level: Level,
  plan: Pick<PlanState, 'currentLevel' | 'currentLevelUnknown'>,
): boolean {
  if (plan.currentLevelUnknown || !plan.currentLevel) return true;
  return LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(plan.currentLevel);
}

export const initialPlan: PlanState = {
  language: null,
  reasons: [],
  currentLevel: null,
  currentLevelUnknown: false,
  targetLevel: null,
  dailyWords: 5,
  focus: [],
  examType: null,
  examLevel: null,
  hasExamDate: false,
  examDateText: '',
};

const BASE_STEPS: StepId[] = [
  'language',
  'reason',
  'currentLevel',
  'targetLevel',
  'dailyWords',
  'focus',
];

/** The exam step only exists when "Exam preparation" is one of the reasons. */
export function stepsFor(plan: PlanState): StepId[] {
  return plan.reasons.includes('EXAM') ? [...BASE_STEPS, 'exam'] : BASE_STEPS;
}

/** "31.12.2026" → "2026-12-31", or null when it is not a real calendar date. */
export function parseGermanDate(text: string): string | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export type ExamDateProblem = 'format' | 'past';

export function examDateProblem(plan: PlanState, today = new Date()): ExamDateProblem | null {
  if (!plan.hasExamDate) return null;
  const iso = parseGermanDate(plan.examDateText);
  if (!iso) return 'format';
  if (iso < today.toISOString().slice(0, 10)) return 'past';
  return null;
}

export function isStepValid(step: StepId, plan: PlanState, today = new Date()): boolean {
  switch (step) {
    case 'language':
      return plan.language !== null;
    case 'reason':
      return plan.reasons.length >= 1;
    case 'currentLevel':
      return plan.currentLevel !== null || plan.currentLevelUnknown;
    case 'targetLevel':
      return plan.targetLevel !== null && isTargetAllowed(plan.targetLevel, plan);
    case 'dailyWords':
      return plan.dailyWords !== null;
    case 'focus':
      return plan.focus.length >= 1 && plan.focus.length <= MAX_FOCUS;
    case 'exam':
      return (
        plan.examType !== null && plan.examLevel !== null && examDateProblem(plan, today) === null
      );
  }
}

/** Call only when every step is valid. Exam fields are sent only for exam preparers. */
export function toRequest(plan: PlanState): OnboardingRequest {
  const exam = plan.reasons.includes('EXAM');
  return {
    preferredLanguage: plan.language!,
    learningReasons: plan.reasons,
    currentLevel: plan.currentLevelUnknown ? null : plan.currentLevel,
    currentLevelUnknown: plan.currentLevelUnknown,
    targetLevel: plan.targetLevel!,
    dailyGoalWords: plan.dailyWords!,
    focusAreas: plan.focus,
    examType: exam ? plan.examType : null,
    examLevel: exam ? plan.examLevel : null,
    examDate: exam && plan.hasExamDate ? parseGermanDate(plan.examDateText) : null,
  };
}
