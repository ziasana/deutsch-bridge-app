import type { ProgressStats } from '@/types/progress';
import { dictionaries } from '@/i18n';
import { SECTION_COLOR } from '@/theme/sectionColors';
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

const A = dictionaries.en.achievements;

describe('achievements', () => {
  it('turns progress into 0–5 stars per achievement', () => {
    const byKey = Object.fromEntries(
      buildAchievements(stats, undefined, 8, A).map((a) => [a.key, a.stars]),
    );
    expect(byKey).toEqual({ vocabulary: 3, grammar: 3, reading: 5, exam: 5, streak: 2 });
  });

  it('starts at zero with no data and sums totals', () => {
    const empty = buildAchievements(undefined, undefined, 0, A);
    expect(empty.every((a) => a.stars === 0)).toBe(true);
    const sum = totals(buildAchievements(stats, undefined, 8, A));
    expect(sum).toEqual({ earned: 18, max: 25, percent: 72 });
  });

  it("tracks progress towards five stars and uses the learning areas' own colours", () => {
    const list = buildAchievements(stats, undefined, 30, A);
    const by = Object.fromEntries(list.map((a) => [a.key, a]));
    expect(by.vocabulary.progress).toBe(60); // 3 of 5 milestones
    expect(by.grammar.progress).toBe(50);
    expect(by.reading.progress).toBe(100);
    expect(by.exam.progress).toBe(100); // 7 exams, capped at five
    expect(by.streak.progress).toBe(50); // 30 of the 60-day top step
    expect(by.grammar.color).toBe(SECTION_COLOR.grammar);
    expect(by.reading.color).toBe(SECTION_COLOR.reading);
    expect(by.exam.color).toBe(SECTION_COLOR.exam);
    expect(by.vocabulary.color).toBe(SECTION_COLOR.vocabulary);
    expect(buildAchievements(undefined, undefined, 0, A).every((a) => a.progress === 0)).toBe(true);
  });
});
