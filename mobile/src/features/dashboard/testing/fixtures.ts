import type { DashboardResponse } from '@/types/dashboard';

export const baseDashboard: DashboardResponse = {
  user: { displayName: 'Ali', learningLevel: 'B1' },
  currentStreak: 6,
  continueLearning: {
    type: 'GRAMMAR',
    title: 'Perfekt',
    progressPercent: 70,
    completed: 7,
    total: 10,
    route: '/dashboard/grammar/lesson?id=1',
  },
  today: {
    completed: 0,
    total: 3,
    activities: [
      { type: 'DAILY_WORDS', completed: false, route: '/dashboard/daily-words' },
      { type: 'VOCAB_REVIEW', completed: false, route: '/dashboard/vocabulary/practice' },
      { type: 'GRAMMAR', completed: false, route: '/dashboard/grammar' },
    ],
  },
  review: { wordsDue: 0, expressionsDue: 0 },
  focus: { area: 'VOCABULARY', route: '/dashboard/vocabulary' },
  week: { days: [true, true, false, true, true, false, false], learningDays: 4, totalDays: 7 },
  milestone: { wordsMastered: 60, nextThreshold: 100 },
  newContent: null,
};

export const withOverrides = (o: Partial<DashboardResponse>): DashboardResponse => ({
  ...baseDashboard,
  ...o,
});
