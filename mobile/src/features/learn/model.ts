import type { Href } from 'expo-router';
import type { Dictionary } from '@/i18n';
import type { DashboardResponse } from '@/types/dashboard';
import type { CategoryProgress, ProgressOverview } from '@/types/progress';
import { percent } from '@/features/progress/segments';
import { SECTION_COLOR } from '@/theme/sectionColors';

export type FeaturedCard = {
  key: string;
  title: string;
  headline: string;
  caption: string;
  href: Href;
  /** 0–100 ring on the card (daily goal progress); null when there is nothing to measure. */
  progress: number | null;
};
export type TopicCard = {
  key: string;
  emoji: string;
  title: string;
  percent: number;
  href: Href;
  tint: string;
  /** Accent colour of the area (tile border, ring, bar). */
  color: string;
  /** What the learner does here, in a few words. */
  subtitle: string;
  /** "12 / 40" */
  detail: string;
};

const DEFAULT_GOAL = 5;

/** The two highlighted cards: today's word goal and what is due for review. */
export function featuredCards(
  overview: ProgressOverview | undefined,
  dashboard: DashboardResponse | undefined,
  t: Dictionary['learn'],
): FeaturedCard[] {
  const goal = overview?.dailyGoalWords ?? DEFAULT_GOAL;
  const today = overview?.itemsLearnedToday ?? 0;
  const due = dashboard ? dashboard.review.wordsDue + dashboard.review.expressionsDue : 0;
  return [
    {
      key: 'daily',
      title: t.dailyWords,
      headline: `${today}/${goal}`,
      caption: t.wordsToday,
      href: '/learn/daily-words',
      progress: percent(today, goal),
    },
    {
      key: 'review',
      title: t.review,
      headline: dashboard ? String(due) : '–',
      caption: t.due,
      href: '/learn/review',
      progress: null,
    },
  ];
}

const pct = (c?: CategoryProgress) => (c ? percent(c.learned, c.total) : 0);

const detail = (c?: CategoryProgress) => `${c?.learned ?? 0} / ${c?.total ?? 0}`;

/** Learning areas with how far the learner is in each. */
export function topicCards(
  overview: ProgressOverview | undefined,
  t: Dictionary['learn'],
): TopicCard[] {
  return [
    {
      key: 'vocabulary',
      emoji: '📚',
      title: t.vocabulary,
      percent: pct(overview?.dailyWords),
      href: '/learn/vocabulary',
      tint: '#F0F6E1',
      color: SECTION_COLOR.vocabulary,
      subtitle: t.vocabularyHint,
      detail: detail(overview?.dailyWords),
    },
    {
      key: 'grammar',
      emoji: '🧱',
      title: t.grammar,
      percent: pct(overview?.grammar),
      href: '/learn/grammar',
      tint: '#E4EEFF',
      color: SECTION_COLOR.grammar,
      subtitle: t.grammarHint,
      detail: detail(overview?.grammar),
    },
    {
      key: 'expressions',
      emoji: '💬',
      title: t.expressions,
      percent: pct(overview?.expressions),
      href: '/learn/expressions',
      tint: '#E4F6EE',
      color: SECTION_COLOR.expressions,
      subtitle: t.expressionsHint,
      detail: detail(overview?.expressions),
    },
    {
      key: 'reading',
      emoji: '📖',
      title: t.reading,
      percent: pct(overview?.reading),
      href: '/learn/reading',
      tint: '#F1E9FD',
      color: SECTION_COLOR.reading,
      subtitle: t.readingHint,
      detail: detail(overview?.reading),
    },
  ];
}
