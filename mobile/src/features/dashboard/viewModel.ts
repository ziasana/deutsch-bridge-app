import type { Dictionary } from '@/i18n';
import type {
  ContinueLearningType,
  CurrentFocusDto,
  DashboardResponse,
  PlanActivityType,
} from '@/types/dashboard';

type HomeText = Dictionary['home'];

export type DashboardMode = 'new' | 'exam' | 'planInProgress' | 'reviewDue' | 'default';

/**
 * Never studied: the backend says START, or there is no streak and no learning day yet. The second
 * rule matters because the plan counts an empty Word Review as "done", which would otherwise make a
 * brand-new account look half finished.
 */
export function isNewLearner(d: DashboardResponse): boolean {
  return (
    d.continueLearning.type === 'START' ||
    (d.currentStreak === 0 &&
      d.week.learningDays === 0 &&
      d.review.wordsDue + d.review.expressionsDue === 0 &&
      d.continueLearning.completed === 0)
  );
}

/** Which of the plan's dashboard states applies. Order matters: first match wins. */
export function getMode(d: DashboardResponse): DashboardMode {
  if (isNewLearner(d)) return 'new';
  if (d.continueLearning.type === 'EXAM') return 'exam';
  if (d.today.completed > 0 && d.today.completed < d.today.total) return 'planInProgress';
  if (d.review.wordsDue + d.review.expressionsDue > 0) return 'reviewDue';
  return 'default';
}

export function greeting(hour: number, t: HomeText): string {
  if (hour < 11) return t.greetMorning;
  if (hour < 18) return t.greetAfternoon;
  return t.greetEvening;
}

export function headline(d: DashboardResponse, hour: number, t: HomeText): string {
  const mode = getMode(d);
  if (mode === 'new') return t.headlineNew;
  if (mode === 'reviewDue') return t.headlineBack;
  return t.greetName(greeting(hour, t), d.user.displayName?.trim() || undefined);
}

export function reviewSummary(words: number, expressions: number, t: HomeText): string {
  return [words > 0 ? t.word(words) : null, expressions > 0 ? t.expression(expressions) : null]
    .filter(Boolean)
    .join(' · ');
}

export function statusMessage(d: DashboardResponse, t: HomeText): string {
  switch (getMode(d)) {
    case 'new':
      return t.status.new;
    case 'exam':
      return t.status.examFocus(d.continueLearning.title ?? t.status.examDefault);
    case 'planInProgress': {
      const { completed, total } = d.today;
      const lead = completed * 2 >= total ? t.status.halfDone : t.status.started;
      return t.status.progress(lead, completed, total);
    }
    case 'reviewDue':
      return t.status.reviewWaiting(reviewSummary(d.review.wordsDue, d.review.expressionsDue, t));
    default:
      return t.status.ready;
  }
}

type ContinueCopy = { emoji: string; title: string; description: string; cta: string };

/** Card copy per recommendation type. Nothing here is computed; counts come from the backend. */
export function continueCopy(
  c: DashboardResponse['continueLearning'],
  t: HomeText,
  isNew = false,
): ContinueCopy {
  const started = c.completed > 0;
  const k = t.continue;
  const map: Record<ContinueLearningType, ContinueCopy> = {
    START: { emoji: '🌱', title: k.first5Title, description: k.first5Desc, cta: k.ctaStart },
    DAILY_WORDS: {
      emoji: '🌱',
      title: isNew ? k.first5Title : t.plan.dailyWords,
      description: isNew ? k.first5Desc : k.dailyDesc,
      cta: started ? k.ctaContinue : k.ctaStart,
    },
    VOCAB_REVIEW: {
      emoji: '🗂️',
      title: t.plan.vocabReview,
      description: k.vocabWaiting(c.total),
      cta: k.ctaStart,
    },
    GRAMMAR: {
      emoji: '🧱',
      title: c.title ?? t.plan.grammar,
      description: k.grammarDesc,
      cta: k.ctaContinue,
    },
    READING: {
      emoji: '📖',
      title: c.title ?? t.plan.reading,
      description: k.readingDesc,
      cta: k.ctaContinue,
    },
    EXPRESSIONS: {
      emoji: '💬',
      title: t.plan.expressions,
      description: k.expressionsDesc,
      cta: k.ctaContinue,
    },
    EXAM: {
      emoji: '🎯',
      title: c.title ?? t.plan.exam,
      description: k.examDesc,
      cta: k.ctaPractice,
    },
  };
  return map[c.type];
}

export const planLabel = (type: PlanActivityType, t: HomeText) =>
  ({
    DAILY_WORDS: t.plan.dailyWords,
    VOCAB_REVIEW: t.plan.wordReview,
    GRAMMAR: t.plan.grammar,
    READING: t.plan.reading,
  })[type];

type FocusCopy = { area: string; text: string; cta: string };

/** Encouraging, never "weakest". Returns null when there is nothing meaningful to suggest. */
export function focusCopy(focus: CurrentFocusDto, t: HomeText): FocusCopy | null {
  switch (focus.area) {
    case 'VOCABULARY':
      return t.focus.vocabulary;
    case 'GRAMMAR':
      return t.focus.grammar;
    case 'READING':
      return t.focus.reading;
    case 'EXPRESSIONS':
      return t.focus.expressions;
    case 'WRITING': {
      const w = t.focus.writing;
      const detail = w.details[focus.detail ?? ''] ?? w.details.STRUCTURE;
      return { area: w.area, text: w.text(detail), cta: w.cta };
    }
    default:
      return null;
  }
}

/** The backend sends the last 7 days oldest → today (a rolling window, not Mon–Sun). */
export function weekDays(
  days: boolean[],
  today: Date,
  t: HomeText,
): { label: string; learned: boolean; isToday: boolean }[] {
  return days.map((learned, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days.length - 1 - i));
    return { label: t.week.weekdays[date.getDay()], learned, isToday: i === days.length - 1 };
  });
}
