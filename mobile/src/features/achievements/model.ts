import type { Dictionary } from '@/i18n';
import type { ProgressOverview, ProgressStats } from '@/types/progress';
import { percent } from '@/features/progress/segments';

export const MAX_STARS = 5;
const STREAK_STEPS = [3, 7, 14, 30, 60];

export type Achievement = {
  key: string;
  emoji: string;
  title: string;
  description: string;
  stars: number;
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
      color: '#2F6FDB',
    },
    {
      key: 'grammar',
      emoji: '🧱',
      title: t.grammar.title,
      description: t.grammar.description(grammar?.lessonsLearned ?? 0, grammar?.lessonsTotal ?? 0),
      stars: grammar ? starsFromPercent(percent(grammar.lessonsLearned, grammar.lessonsTotal)) : 0,
      color: '#B7790A',
    },
    {
      key: 'reading',
      emoji: '📖',
      title: t.reading.title,
      description: t.reading.description(reading?.learned ?? 0, reading?.total ?? 0),
      stars: reading ? starsFromPercent(percent(reading.learned, reading.total)) : 0,
      color: '#2E8B6E',
    },
    {
      key: 'exam',
      emoji: '🎓',
      title: t.exam.title,
      description: t.exam.description(attempts),
      stars: Math.min(MAX_STARS, attempts),
      color: '#3B6CA8',
    },
    {
      key: 'streak',
      emoji: '🔥',
      title: t.streak.title,
      description: t.streak.description(streak),
      stars: STREAK_STEPS.filter((s) => streak >= s).length,
      color: '#C2531B',
    },
  ];
}

export function totals(list: Achievement[]) {
  const earned = list.reduce((n, a) => n + a.stars, 0);
  const max = list.length * MAX_STARS;
  return { earned, max, percent: percent(earned, max) };
}
