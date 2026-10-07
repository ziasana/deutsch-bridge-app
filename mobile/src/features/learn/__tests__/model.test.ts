import { baseDashboard } from '@/features/dashboard/testing/fixtures';
import type { ProgressOverview } from '@/types/progress';
import { dictionaries } from '@/i18n';
import { featuredCards, topicCards } from '../model';

const L = dictionaries.en.learn;
const overview = {
  dailyGoalWords: 10,
  itemsLearnedToday: 4,
  dailyWords: { learned: 30, total: 120 },
  grammar: { learned: 5, total: 10 },
  expressions: { learned: 0, total: 0 },
  reading: { learned: 1, total: 3 },
  totalLearned: 36,
  totalAvailable: 133,
} as ProgressOverview;

describe('learn model', () => {
  it('shows today’s goal and review count', () => {
    const [daily, review] = featuredCards(
      overview,
      {
        ...baseDashboard,
        review: { wordsDue: 3, expressionsDue: 2 },
      },
      L,
    );
    expect(daily.headline).toBe('4/10');
    expect(review.headline).toBe('5');
  });

  it('falls back gracefully without data', () => {
    expect(featuredCards(undefined, undefined, L)[0].headline).toBe('0/5');
    expect(topicCards(undefined, L).every((t) => t.percent === 0)).toBe(true);
  });

  it('computes per-area percentages, guarding empty totals', () => {
    const byKey = Object.fromEntries(topicCards(overview, L).map((t) => [t.key, t.percent]));
    expect(byKey).toEqual({ vocabulary: 25, grammar: 50, expressions: 0, reading: 33 });
  });
});
