import type { ContinueLearningType, CurrentFocusDto, DashboardResponse } from '@/types/dashboard';

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

export function greeting(hour: number): string {
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export function headline(d: DashboardResponse, hour: number): string {
  const mode = getMode(d);
  if (mode === 'new') return 'Willkommen 👋';
  if (mode === 'reviewDue') return 'Willkommen zurück 👋';
  const name = d.user.displayName?.trim();
  return `${greeting(hour)}${name ? `, ${name}` : ''} 👋`;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function reviewSummary(words: number, expressions: number): string {
  return [
    words > 0 ? plural(words, 'Wort', 'Wörter') : null,
    expressions > 0 ? plural(expressions, 'Redewendung', 'Redewendungen') : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function statusMessage(d: DashboardResponse): string {
  switch (getMode(d)) {
    case 'new':
      return 'Lass uns deine Deutsch-Lernroutine starten.';
    case 'exam':
      return `Dein aktueller Fokus: ${d.continueLearning.title ?? 'Prüfungsvorbereitung'}`;
    case 'planInProgress': {
      const { completed, total } = d.today;
      const lead =
        completed * 2 >= total
          ? 'Du bist heute schon halb fertig.'
          : 'Du hast heute schon angefangen.';
      return `${lead} ${completed} von ${total} Aktivitäten abgeschlossen.`;
    }
    case 'reviewDue':
      return `${reviewSummary(d.review.wordsDue, d.review.expressionsDue)} warten auf Wiederholung.`;
    default:
      return 'Bereit für deine nächste Deutsch-Lerneinheit?';
  }
}

type ContinueCopy = { emoji: string; title: string; description: string; cta: string };

/** Card copy per recommendation type. Nothing here is computed; counts come from the backend. */
export function continueCopy(
  c: DashboardResponse['continueLearning'],
  isNew = false,
): ContinueCopy {
  const started = c.completed > 0;
  const map: Record<ContinueLearningType, ContinueCopy> = {
    START: {
      emoji: '🌱',
      title: 'Erste 5 Wörter lernen',
      description: 'Ein kleiner Start für deine Lernroutine.',
      cta: 'Jetzt starten',
    },
    DAILY_WORDS: {
      emoji: '🌱',
      title: isNew ? 'Erste 5 Wörter lernen' : 'Daily Words',
      description: isNew ? 'Ein kleiner Start für deine Lernroutine.' : 'Deine Wörter für heute.',
      cta: started ? 'Weiterlernen' : 'Jetzt starten',
    },
    VOCAB_REVIEW: {
      emoji: '🔄',
      title: 'Vocabulary Review',
      description: `${plural(c.total, 'Wort wartet', 'Wörter warten')} auf dich.`,
      cta: 'Jetzt starten',
    },
    GRAMMAR: {
      emoji: '🧩',
      title: c.title ?? 'Grammatik',
      description: 'Mach mit deiner Grammatik weiter.',
      cta: 'Weiterlernen',
    },
    READING: {
      emoji: '📖',
      title: c.title ?? 'Reading',
      description: 'Lies weiter und verstehe mehr.',
      cta: 'Weiterlernen',
    },
    EXPRESSIONS: {
      emoji: '💬',
      title: 'Active Expressions',
      description: 'Aktive Wendungen festigen.',
      cta: 'Weiterlernen',
    },
    EXAM: {
      emoji: '🎯',
      title: c.title ?? 'Prüfungsvorbereitung',
      description: 'Bleib im Prüfungsrhythmus.',
      cta: 'Weiterüben',
    },
  };
  return map[c.type];
}

export const PLAN_LABEL = {
  DAILY_WORDS: 'Daily Words',
  VOCAB_REVIEW: 'Word Review',
  GRAMMAR: 'Grammatik',
  READING: 'Reading',
} as const;

type FocusCopy = { area: string; text: string; cta: string };

/** Encouraging, never "weakest". Returns null when there is nothing meaningful to suggest. */
export function focusCopy(focus: CurrentFocusDto): FocusCopy | null {
  switch (focus.area) {
    case 'VOCABULARY':
      return {
        area: 'Wortschatz',
        text: 'Ein wenig mehr Wortschatz-Wiederholung könnte dein Lernen stärken.',
        cta: 'Wortschatz üben',
      };
    case 'GRAMMAR':
      return {
        area: 'Grammatik',
        text: 'Mit etwas mehr Grammatik-Praxis festigst du dein Fundament.',
        cta: 'Grammatik üben',
      };
    case 'READING':
      return {
        area: 'Lesen',
        text: 'Ein weiterer Text hilft dir, sicherer im Leseverstehen zu werden.',
        cta: 'Lesen üben',
      };
    case 'EXPRESSIONS':
      return {
        area: 'Redewendungen',
        text: 'Aktive Wendungen machen deine Sprache natürlicher.',
        cta: 'Redewendungen üben',
      };
    case 'WRITING': {
      const detail: Record<string, string> = {
        TASK: 'die Aufgabenstellung',
        STRUCTURE: 'den Aufbau deines Textes',
        VOCABULARY: 'einen abwechslungsreichen Wortschatz',
        FORM: 'Form und Anrede',
      };
      return {
        area: 'Schreiben',
        text: `Achte beim Schreiben in nächster Zeit besonders auf ${detail[focus.detail ?? ''] ?? detail.STRUCTURE}.`,
        cta: 'Schreiben üben',
      };
    }
    default:
      return null;
  }
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** The backend sends the last 7 days oldest → today (a rolling window, not Mon–Sun). */
export function weekDays(
  days: boolean[],
  today: Date,
): { label: string; learned: boolean; isToday: boolean }[] {
  return days.map((learned, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days.length - 1 - i));
    return { label: WEEKDAYS[date.getDay()], learned, isToday: i === days.length - 1 };
  });
}
