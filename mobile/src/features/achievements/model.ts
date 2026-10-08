import type { Dictionary } from '@/i18n';
import type { ProgressOverview, ProgressStats } from '@/types/progress';
import { percent } from '@/features/progress/segments';
import { SECTION_COLOR } from '@/theme/sectionColors';

export const MAX_STARS = 5;
const STREAK_STEPS = [3, 7, 14, 30, 60];
/** The flame colour the home screen's streak uses; streaks are not a learning area. */
const STREAK_COLOR = '#F5762B';

export type Achievement = {
  key: string;
  emoji: string;
  title: string;
  description: string;
  stars: number;
  /** 0-100: how far along the learner is towards all five stars. */
  progress: number;
  /** The learning area's accent, the same one its screens and tiles use. */
  color: string;
};

const starsFromPercent = (p: number) => Math.min(MAX_STARS, Math.round(p / (100 / MAX_STARS)));

/** Achievements are derived from learning progress — nothing extra is stored on the server. */
export function buildAchievements(
  stats: ProgressStats | undefined,
  overview: ProgressOverview | undefined,
  streak: number,
  t: Dictionary['achievements'],
): Achievement[] {
  const m = stats?.milestones;
  const reached = m ? m.reached.filter(Boolean).length : 0;
  const reading = stats?.reading ?? overview?.reading;
  const grammar = stats?.grammar;
  const attempts = stats?.examPerformance.attemptsCompleted ?? 0;

  return [
    {
      key: 'vocabulary',
      emoji: '🏆',
      title: t.vocabulary.title,
      description: t.vocabulary.description(m?.wordsMastered ?? 0),
      stars:
        m && m.thresholds.length
          ? Math.min(MAX_STARS, Math.round((reached / m.thresholds.length) * MAX_STARS))
          : 0,
      progress: m && m.thresholds.length ? percent(reached, m.thresholds.length) : 0,
      color: SECTION_COLOR.vocabulary,
    },
    {
      key: 'grammar',
      emoji: '🧱',
      title: t.grammar.title,
      description: t.grammar.description(grammar?.lessonsLearned ?? 0, grammar?.lessonsTotal ?? 0),
      stars: grammar ? starsFromPercent(percent(grammar.lessonsLearned, grammar.lessonsTotal)) : 0,
      progress: grammar ? percent(grammar.lessonsLearned, grammar.lessonsTotal) : 0,
      color: SECTION_COLOR.grammar,
    },
    {
      key: 'reading',
      emoji: '📖',
      title: t.reading.title,
      description: t.reading.description(reading?.learned ?? 0, reading?.total ?? 0),
      stars: reading ? starsFromPercent(percent(reading.learned, reading.total)) : 0,
      progress: reading ? percent(reading.learned, reading.total) : 0,
      color: SECTION_COLOR.reading,
    },
    {
      key: 'exam',
      emoji: '🎓',
      title: t.exam.title,
      description: t.exam.description(attempts),
      stars: Math.min(MAX_STARS, attempts),
      progress: percent(Math.min(MAX_STARS, attempts), MAX_STARS),
      color: SECTION_COLOR.exam,
    },
    {
      key: 'streak',
      emoji: '🔥',
      title: t.streak.title,
      description: t.streak.description(streak),
      stars: STREAK_STEPS.filter((s) => streak >= s).length,
      progress: percent(streak, STREAK_STEPS[STREAK_STEPS.length - 1]),
      color: STREAK_COLOR,
    },
  ];
}

export function totals(list: Achievement[]) {
  const earned = list.reduce((n, a) => n + a.stars, 0);
  const max = list.length * MAX_STARS;
  return { earned, max, percent: percent(earned, max) };
}
