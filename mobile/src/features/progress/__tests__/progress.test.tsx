import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { dashboardApi } from '@/api/dashboardApi';
import { progressApi } from '@/api/progressApi';
import type { ProgressOverview, ProgressStats } from '@/types/progress';
import { ProgressScreen } from '../ProgressScreen';
import { dictionaries } from '@/i18n';
import { expressionSegments, nextMilestoneText, percent, vocabularySegments } from '../segments';

jest.mock('@/api/progressApi');
jest.mock('@/api/dashboardApi');
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useFocusEffect: () => {},
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const api = progressApi as jest.Mocked<typeof progressApi>;

const overview: ProgressOverview = {
  dailyGoalWords: 10,
  itemsLearnedToday: 4,
  dailyWords: { learned: 20, total: 50 },
  grammar: { learned: 3, total: 30 },
  expressions: { learned: 5, total: 100 },
  reading: { learned: 2, total: 20 },
  totalLearned: 30,
  totalAvailable: 200,
};
const stats: ProgressStats = {
  milestones: {
    wordsMastered: 30,
    thresholds: [10, 50, 100],
    reached: [true, false, false],
    nextThreshold: 50,
  },
  vocabulary: { newCount: 5, learning: 8, familiar: 4, mastered: 3, total: 20 },
  expressions: { newCount: 0, learning: 0, familiar: 0, active: 0, mastered: 0, total: 0 },
  grammar: {
    lessonsLearned: 3,
    lessonsTotal: 30,
    categoriesPassed: 1,
    categoriesAttempted: 2,
    categoriesTotal: 6,
  },
  reading: { learned: 2, total: 20 },
  examPerformance: { averageScore: 72.4, attemptsCompleted: 3 },
};

const wrap = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      <ProgressScreen />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.resetAllMocks();
  (dashboardApi.get as jest.Mock).mockResolvedValue({
    currentStreak: 6,
    user: { displayName: 'Ali', learningLevel: 'B1' },
    week: { days: [true, true, false, true, false, false, false], learningDays: 3, totalDays: 7 },
  });
});

const P = dictionaries.en.progress;

describe('segments', () => {
  it('computes percentages safely and orders mastery segments', () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(5, 0)).toBe(0);
    expect(percent(9, 3)).toBe(100);
    const c = { new: 'n', learning: 'l', familiar: 'f', active: 'a', mastered: 'm' };
    expect(vocabularySegments(stats.vocabulary, c, P).map((s) => [s.label, s.count])).toEqual([
      ['New', 5],
      ['Learning', 8],
      ['Familiar', 4],
      ['Mastered', 3],
    ]);
    expect(expressionSegments({ ...stats.expressions, active: 2 }, c, P).map((s) => s.key)).toEqual(
      ['new', 'learning', 'familiar', 'active', 'mastered'],
    );
  });

  it('words the next milestone', () => {
    expect(nextMilestoneText(stats.milestones, P)).toBe('20 more words until 50');
    expect(nextMilestoneText({ ...stats.milestones, wordsMastered: 49 }, P)).toBe(
      '1 more word until 50',
    );
    expect(nextMilestoneText({ ...stats.milestones, nextThreshold: null }, P)).toMatch(
      /All milestones/,
    );
  });
});

describe('ProgressScreen', () => {
  it('shows totals, streak, tiles, mastery, grammar, exams and milestones', async () => {
    api.overview.mockResolvedValue(overview);
    api.stats.mockResolvedValue(stats);
    await wrap();
    expect(await screen.findByText('LEARNED IN TOTAL')).toBeTruthy();
    expect(await screen.findByText('6 days')).toBeTruthy();
    expect(screen.getByLabelText('3 of 7 days learned')).toBeTruthy();
    expect(screen.getByText('Today: 4 / 10 learning goals')).toBeTruthy();
    expect(screen.getByText('20 / 50')).toBeTruthy(); // daily words
    // "Words mastered" is the learner's own vocabulary, not the platform's content: the hero keeps
    // the overall 30 / 200, the tile shows 3 of the learner's 20 words.
    expect(screen.getByRole('button', { name: /^Words mastered: 3 of 20/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Words mastered: 30 of 200/ })).toBeNull();
    expect(
      screen.getByLabelText(/📚 Vocabulary: New 5, Learning 8, Familiar 4, Mastered 3/),
    ).toBeTruthy();
    expect(screen.getByText('Lessons: 3 / 30')).toBeTruthy();
    expect(screen.getByText(/Category tests passed: 1 \/ 6 \(2 attempted\)/)).toBeTruthy();
    expect(screen.getByText('Average: 72% · 3 attempts')).toBeTruthy();
    expect(screen.getByText('20 more words until 50')).toBeTruthy();
    expect(screen.getByLabelText('10 words, reached')).toBeTruthy();

    // Tapping a mastery chip spotlights that step with its share.
    await fireEvent.press(screen.getByRole('button', { name: 'Learning · 8' }));
    expect(screen.getByText('Learning: 40% of your 20 entries')).toBeTruthy();

    // Area tiles lead into the learning areas.
    await fireEvent.press(screen.getByRole('button', { name: /^Grammar lessons: 3 of 30/ }));
    expect(mockPush).toHaveBeenCalledWith('/learn/grammar');

    // Expressions are empty: a call to action instead of an empty bar.
    await fireEvent.press(screen.getByRole('button', { name: 'Practise expressions' }));
    expect(mockPush).toHaveBeenCalledWith('/learn/expressions');
  });

  it('shows an empty state before anything was learned', async () => {
    api.overview.mockResolvedValue({ ...overview, totalLearned: 0, totalAvailable: 0 });
    api.stats.mockResolvedValue({ ...stats, vocabulary: { ...stats.vocabulary, total: 0 } });
    await wrap();
    expect(await screen.findByText('No progress yet')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Learn now' }));
    expect(mockPush).toHaveBeenCalledWith('/learn');
  });

  it('shows an error state with retry', async () => {
    api.overview
      .mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'))
      .mockResolvedValue(overview);
    api.stats.mockResolvedValue(stats);
    await wrap();
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('LEARNED IN TOTAL')).toBeTruthy();
  });
});
