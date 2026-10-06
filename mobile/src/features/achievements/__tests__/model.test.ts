import type { ProgressStats } from '@/types/progress';
import { buildAchievements, totals } from '../model';

const stats = {
  milestones: {
    wordsMastered: 120,
    thresholds: [10, 50, 100, 250, 500],
    reached: [true, true, true, false, false],
    nextThreshold: 250,
  },
  vocabulary: { newCount: 0, learning: 0, familiar: 0, mastered: 120, total: 120 },
  expressions: { newCount: 0, learning: 0, familiar: 0, mastered: 0, total: 0, active: 0 },
  grammar: {
    lessonsLearned: 5,
    lessonsTotal: 10,
    categoriesPassed: 0,
    categoriesAttempted: 0,
    categoriesTotal: 0,
  },
  reading: { learned: 3, total: 3 },
  examPerformance: { averageScore: 80, attemptsCompleted: 7 },
} as ProgressStats;

describe('achievements', () => {
  it('turns progress into 0–5 stars per achievement', () => {
    const byKey = Object.fromEntries(
      buildAchievements(stats, undefined, 8).map((a) => [a.key, a.stars]),
    );
    expect(byKey).toEqual({ vocabulary: 3, grammar: 3, reading: 5, exam: 5, streak: 2 });
  });

  it('starts at zero with no data and sums totals', () => {
    const empty = buildAchievements(undefined, undefined, 0);
    expect(empty.every((a) => a.stars === 0)).toBe(true);
    const sum = totals(buildAchievements(stats, undefined, 8));
    expect(sum).toEqual({ earned: 18, max: 25, percent: 72 });
  });
});
