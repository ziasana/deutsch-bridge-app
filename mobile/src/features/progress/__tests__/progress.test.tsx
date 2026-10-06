import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { dashboardApi } from '@/api/dashboardApi';
import { progressApi } from '@/api/progressApi';
import type { ProgressOverview, ProgressStats } from '@/types/progress';
import { ProgressScreen } from '../ProgressScreen';
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

describe('segments', () => {
  it('computes percentages safely and orders mastery segments', () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(5, 0)).toBe(0);
    expect(percent(9, 3)).toBe(100);
    const c = { new: 'n', learning: 'l', familiar: 'f', active: 'a', mastered: 'm' };
    expect(vocabularySegments(stats.vocabulary, c).map((s) => [s.label, s.count])).toEqual([
      ['Neu', 5],
      ['Am Lernen', 8],
      ['Vertraut', 4],
      ['Gemeistert', 3],
    ]);
    expect(expressionSegments({ ...stats.expressions, active: 2 }, c).map((s) => s.key)).toEqual([
      'new',
      'learning',
      'familiar',
      'active',
      'mastered',
    ]);
  });

  it('words the next milestone', () => {
    expect(nextMilestoneText(stats.milestones)).toBe('Noch 20 Wörter bis 50');
    expect(nextMilestoneText({ ...stats.milestones, wordsMastered: 49 })).toBe(
      'Noch 1 Wort bis 50',
    );
    expect(nextMilestoneText({ ...stats.milestones, nextThreshold: null })).toMatch(
      /Alle Meilensteine/,
    );
  });
});

describe('ProgressScreen', () => {
  it('shows totals, streak, tiles, mastery, grammar, exams and milestones', async () => {
    api.overview.mockResolvedValue(overview);
    api.stats.mockResolvedValue(stats);
    await wrap();
    expect(await screen.findByText('INSGESAMT GELERNT')).toBeTruthy();
    expect(await screen.findByText('6 Tage')).toBeTruthy();
    expect(screen.getByLabelText('3 von 7 Tagen gelernt')).toBeTruthy();
    expect(screen.getByText('Heute: 4 / 10 Lernziele')).toBeTruthy();
    expect(screen.getByText('20 / 50')).toBeTruthy(); // daily words
    expect(
      screen.getByLabelText(/Wortschatz: Neu 5, Am Lernen 8, Vertraut 4, Gemeistert 3/),
    ).toBeTruthy();
    expect(screen.getByText('Lektionen: 3 / 30')).toBeTruthy();
    expect(screen.getByText(/Kategorie-Tests bestanden: 1 \/ 6 \(2 versucht\)/)).toBeTruthy();
    expect(screen.getByText('Durchschnitt: 72% · 3 Versuche')).toBeTruthy();
    expect(screen.getByText('Noch 20 Wörter bis 50')).toBeTruthy();
    expect(screen.getByLabelText('10 Wörter, erreicht')).toBeTruthy();

    // Tapping a mastery chip spotlights that step with its share.
    await fireEvent.press(screen.getByRole('button', { name: 'Am Lernen · 8' }));
    expect(screen.getByText('Am Lernen: 40% deiner 20 Einträge')).toBeTruthy();

    // Area tiles lead into the learning areas.
    await fireEvent.press(screen.getByRole('button', { name: /^Grammatik-Lektionen: 3 von 30/ }));
    expect(mockPush).toHaveBeenCalledWith('/learn/grammar');

    // Expressions are empty: a call to action instead of an empty bar.
    await fireEvent.press(screen.getByRole('button', { name: 'Ausdrücke üben' }));
    expect(mockPush).toHaveBeenCalledWith('/learn/expressions');
  });

  it('shows an empty state before anything was learned', async () => {
    api.overview.mockResolvedValue({ ...overview, totalLearned: 0, totalAvailable: 0 });
    api.stats.mockResolvedValue({ ...stats, vocabulary: { ...stats.vocabulary, total: 0 } });
    await wrap();
    expect(await screen.findByText('Noch kein Fortschritt')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Jetzt lernen' }));
    expect(mockPush).toHaveBeenCalledWith('/learn');
  });

  it('shows an error state with retry', async () => {
    api.overview
      .mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'))
      .mockResolvedValue(overview);
    api.stats.mockResolvedValue(stats);
    await wrap();
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(await screen.findByText('INSGESAMT GELERNT')).toBeTruthy();
  });
});
