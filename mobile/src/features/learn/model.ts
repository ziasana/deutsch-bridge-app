import type { Href } from 'expo-router';
import type { DashboardResponse } from '@/types/dashboard';
import type { CategoryProgress, ProgressOverview } from '@/types/progress';
import { percent } from '@/features/progress/segments';

export type FeaturedCard = {
  key: string;
  title: string;
  headline: string;
  caption: string;
  href: Href;
};
export type TopicCard = {
  key: string;
  emoji: string;
  title: string;
  percent: number;
  href: Href;
  tint: string;
};

const DEFAULT_GOAL = 5;

/** The two highlighted cards: today's word goal and what is due for review. */
export function featuredCards(
  overview?: ProgressOverview,
  dashboard?: DashboardResponse,
): FeaturedCard[] {
  const goal = overview?.dailyGoalWords ?? DEFAULT_GOAL;
  const today = overview?.itemsLearnedToday ?? 0;
  const due = dashboard ? dashboard.review.wordsDue + dashboard.review.expressionsDue : 0;
  return [
    {
      key: 'daily',
      title: 'Daily Words',
      headline: `${today}/${goal}`,
      caption: 'Wörter heute',
      href: '/learn/daily-words',
    },
    {
      key: 'review',
      title: 'Wiederholen',
      headline: dashboard ? String(due) : '–',
      caption: 'fällig',
      href: '/learn/review',
    },
  ];
}

const pct = (c?: CategoryProgress) => (c ? percent(c.learned, c.total) : 0);

/** Learning areas with how far the learner is in each. */
export function topicCards(overview?: ProgressOverview): TopicCard[] {
  return [
    {
      key: 'vocabulary',
      emoji: '📚',
      title: 'Wortschatz',
      percent: pct(overview?.dailyWords),
      href: '/learn/vocabulary',
      tint: '#E4EEFF',
    },
    {
      key: 'grammar',
      emoji: '🧩',
      title: 'Grammatik',
      percent: pct(overview?.grammar),
      href: '/learn/grammar',
      tint: '#FDEFE0',
    },
    {
      key: 'expressions',
      emoji: '💬',
      title: 'Redewendungen',
      percent: pct(overview?.expressions),
      href: '/learn/expressions',
      tint: '#E4F6EE',
    },
    {
      key: 'reading',
      emoji: '📖',
      title: 'Lesen',
      percent: pct(overview?.reading),
      href: '/learn/reading',
      tint: '#F1E9FD',
    },
  ];
}
