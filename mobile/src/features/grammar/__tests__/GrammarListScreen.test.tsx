import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { grammarApi } from '@/api/grammarApi';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { GrammarListScreen } from '../GrammarListScreen';
import { makeLevelView } from '../testing/fixtures';

jest.mock('@/api/grammarApi');
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const summary = grammarApi.levelSummary as jest.MockedFunction<typeof grammarApi.levelSummary>;
const levelView = grammarApi.levelView as jest.MockedFunction<typeof grammarApi.levelView>;

const renderScreen = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      <GrammarListScreen />
    </QueryClientProvider>,
  );

describe('GrammarListScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useAuthStore.setState({
      profile: { learningLevel: 'A2', preferredLanguage: 'EN' } as UserProfile,
    });
    summary.mockResolvedValue([
      { level: 'A1', total: 4, learned: 4 },
      { level: 'A2', total: 6, learned: 1 },
    ]);
    levelView.mockResolvedValue(makeLevelView());
  });

  it('shows level chips with progress and starts on the learner level', async () => {
    await renderScreen();
    expect(await screen.findByRole('button', { name: 'A2 · 1/6' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'A1 · 4/4' })).toBeTruthy();
    expect(levelView).toHaveBeenCalledWith('A2');
    expect(screen.getByText('Vergangenheit')).toBeTruthy();
    expect(screen.getByText('1 von 2 Themen gelernt')).toBeTruthy();
    expect(screen.getByText('Test bestanden')).toBeTruthy();
  });

  it('expands a category, opens a lesson and the category test', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByText('Vergangenheit'));
    expect(await screen.findByText('Lektion l1')).toBeTruthy();
    expect(screen.getByText('Gelernt')).toBeTruthy();

    await fireEvent.press(screen.getByText('Lektion l2'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/grammar/[lessonId]',
      params: { lessonId: 'l2' },
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Kategorie-Test starten' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/grammar/category-test/[categoryId]',
      params: { categoryId: 'c1' },
    });
  });

  it('switches level', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'A1 · 4/4' }));
    expect(levelView).toHaveBeenCalledWith('A1');
  });

  it('shows an intentional empty state', async () => {
    levelView.mockResolvedValue({ level: 'A2', categories: [], uncategorized: [] });
    await renderScreen();
    expect(await screen.findByText('Noch keine Lektionen')).toBeTruthy();
  });

  it('shows an error state with retry', async () => {
    summary.mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'));
    await renderScreen();
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
    summary.mockResolvedValue([{ level: 'A2', total: 1, learned: 0 }]);
    await fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(await screen.findByText('Vergangenheit')).toBeTruthy();
  });
});
