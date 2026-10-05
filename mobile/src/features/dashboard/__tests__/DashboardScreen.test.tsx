import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { dashboardApi } from '@/api/dashboardApi';
import { ApiError } from '@/api/errors';
import { DashboardScreen } from '../DashboardScreen';
import { baseDashboard, withOverrides } from '../testing/fixtures';

jest.mock('@/api/dashboardApi');
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
