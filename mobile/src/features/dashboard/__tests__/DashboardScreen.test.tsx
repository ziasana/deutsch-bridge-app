import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { dashboardApi } from '@/api/dashboardApi';
import { examTimeApi } from '@/api/examTimeApi';
import { grammarApi } from '@/api/grammarApi';
import { redemittelApi } from '@/api/redemittelApi';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { ApiError } from '@/api/errors';
import { DashboardScreen } from '../DashboardScreen';
import { baseDashboard, withOverrides } from '../testing/fixtures';

jest.mock('@/api/dashboardApi');
jest.mock('@/api/grammarApi');
jest.mock('@/api/examTimeApi');
jest.mock('@/api/redemittelApi');
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const get = dashboardApi.get as jest.MockedFunction<typeof dashboardApi.get>;

const renderScreen = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      <DashboardScreen />
    </QueryClientProvider>,
  );

describe('DashboardScreen', () => {
  beforeEach(() => {
    get.mockReset();
    mockPush.mockReset();
    (redemittelApi.hub as jest.Mock).mockReset().mockResolvedValue({
      dueCount: 0,
      newToday: 0,
      dailyTarget: 3,
      learnedToday: 0,
      savedCount: 0,
      summary: { learned: 0, mastered: 0, review: 0, learning: 0, fresh: 0 },
      categories: [],
    });
    (grammarApi.pendingBookmarks as jest.Mock).mockReset().mockResolvedValue([]);
    (examTimeApi.weekSummary as jest.Mock)
      .mockReset()
      .mockResolvedValue({ timedExercisesThisWeek: 3 });
    useAuthStore.setState({ profile: { examType: null, examLevel: null } as UserProfile });
  });

  it('shows new-content and saved-lessons banners that link on', async () => {
    (grammarApi.pendingBookmarks as jest.Mock).mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    get.mockResolvedValue(
      withOverrides({
        newContent: { grammarLessons: 2, readingArticles: 1, expressions: 0, total: 3 },
      }),
    );
    await renderScreen();
    expect(await screen.findByText('3 neue Inhalte für dich')).toBeTruthy();
    expect(screen.getByText('2 Grammatiklektionen · 1 Lesetext')).toBeTruthy();
    expect(await screen.findByText('2 gemerkte Lektionen warten')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Gemerkte Lektionen öffnen' }));
    expect(mockPush).toHaveBeenCalledWith('/learn/grammar');
  });

  it('offers quick access to every learning area', async () => {
    get.mockResolvedValue(baseDashboard);
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Lesen öffnen' }));
    expect(mockPush).toHaveBeenCalledWith('/learn/reading');
  });

  it('shows the TELC exam nudge only for TELC learners', async () => {
    get.mockResolvedValue(baseDashboard);
    useAuthStore.setState({ profile: { examType: 'TELC', examLevel: 'B1' } as UserProfile });
    await renderScreen();
    expect(await screen.findByText('TELC B1 Vorbereitung')).toBeTruthy();
    expect(
      await screen.findByText('Du hast diese Woche 3 Prüfungsübungen mit Zeitlimit abgeschlossen.'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'TELC B1 Vorbereitung' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/exam-prep/zeitmanagement',
      params: { level: 'B1' },
    });
  });

  it('lets you tap a day of the week for its details', async () => {
    get.mockResolvedValue(baseDashboard);
    await renderScreen();
    const days = await screen.findAllByRole('button', { name: /: (gelernt|nicht gelernt)$/ });
    expect(days).toHaveLength(7);
    await fireEvent.press(days[0]);
    expect(await screen.findByText(/Gelernt 🔥$/)).toBeTruthy();
  });

  it('shows a skeleton while loading', async () => {
    get.mockReturnValue(new Promise(() => {}));
    await renderScreen();
    expect(screen.getByLabelText('Dashboard wird geladen')).toBeTruthy();
  });

  it('renders the orchestrated sections and navigates with mapped routes', async () => {
    get.mockResolvedValue(withOverrides({ review: { wordsDue: 8, expressionsDue: 3 } }));
    await renderScreen();

    expect(await screen.findByText('Willkommen zurück 👋')).toBeTruthy();
    expect(screen.getByText('🔥 6 Tage')).toBeTruthy();
    expect(screen.getByText('B1')).toBeTruthy();
    expect(screen.getByText('Perfekt')).toBeTruthy(); // backend-provided title
    expect(screen.getByText('8 Wörter · 3 Redewendungen')).toBeTruthy();
    expect(screen.getByText('4 / 7 Lerntage')).toBeTruthy();
    expect(screen.getByText('🏆 60 Wörter gemeistert')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Weiterlernen' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/grammar/[lessonId]',
      params: { lessonId: '1' },
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Jetzt wiederholen' }));
    expect(mockPush).toHaveBeenCalledWith('/learn/review');

    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));
    expect(mockPush).toHaveBeenCalledWith('/learn/daily-words');
  });

  it('new learner: start CTA and no empty statistics', async () => {
    get.mockResolvedValue(
      withOverrides({
        currentStreak: 0,
        continueLearning: {
          type: 'START',
          title: null,
          progressPercent: null,
          completed: 0,
          total: 0,
          route: '/dashboard/daily-words',
        },
        today: { completed: 0, total: 0, activities: [] },
        focus: { area: null, route: null },
        milestone: null,
        week: { days: Array(7).fill(false), learningDays: 0, totalDays: 7 },
      }),
    );
    await renderScreen();
    expect(await screen.findByText('Willkommen 👋')).toBeTruthy();
    expect(screen.queryByText('🔥 0 Tage')).toBeNull();
    expect(screen.queryByText("Today's Plan")).toBeNull();
    expect(screen.queryByText('🎯 Dein aktueller Fokus')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Jetzt starten' }));
    expect(mockPush).toHaveBeenCalledWith('/learn/daily-words');
  });

  it('shows an intentional empty state when nothing is due for review', async () => {
    get.mockResolvedValue(baseDashboard);
    await renderScreen();
    expect(
      await screen.findByText('🎉 Du hast momentan keine Wörter zur Wiederholung.'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Neue Wörter lernen' }));
    expect(mockPush).toHaveBeenCalledWith('/learn/daily-words');
  });

  it('shows a friendly error with retry for network failures', async () => {
    get.mockRejectedValueOnce(
      new ApiError(
        'network',
        'Keine Verbindung. Bitte überprüfe dein Internet und versuche es erneut.',
      ),
    );
    await renderScreen();
    expect(await screen.findByText(/Keine Verbindung/)).toBeTruthy();
    get.mockResolvedValueOnce(baseDashboard);
    await fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(await screen.findByText('Perfekt')).toBeTruthy();
  });
});
