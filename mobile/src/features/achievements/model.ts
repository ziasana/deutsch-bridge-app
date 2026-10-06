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
      title: 'Wortschatz-Profi',
      description: `Du hast ${m?.wordsMastered ?? 0} Wörter gemeistert.`,
      stars:
        m && m.thresholds.length
          ? Math.min(MAX_STARS, Math.round((reached / m.thresholds.length) * MAX_STARS))
          : 0,
      color: '#2F6FDB',
    },
    {
      key: 'grammar',
      emoji: '🧩',
      title: 'Grammatik-Held',
      description: `${grammar?.lessonsLearned ?? 0} von ${grammar?.lessonsTotal ?? 0} Lektionen abgeschlossen.`,
      stars: grammar ? starsFromPercent(percent(grammar.lessonsLearned, grammar.lessonsTotal)) : 0,
      color: '#B7790A',
    },
    {
      key: 'reading',
      emoji: '📖',
      title: 'Leseratte',
      description: `Du hast ${reading?.learned ?? 0} von ${reading?.total ?? 0} Texten gelesen.`,
      stars: reading ? starsFromPercent(percent(reading.learned, reading.total)) : 0,
      color: '#2E8B6E',
    },
    {
      key: 'exam',
      emoji: '🎓',
      title: 'Prüfungsprofi',
      description: `Du hast ${attempts} ${attempts === 1 ? 'Prüfung' : 'Prüfungen'} abgeschlossen.`,
      stars: Math.min(MAX_STARS, attempts),
      color: '#3B6CA8',
    },
    {
      key: 'streak',
      emoji: '🔥',
      title: 'Dranbleiber',
      description: `Deine Serie: ${streak} ${streak === 1 ? 'Tag' : 'Tage'} in Folge.`,
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
