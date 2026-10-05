import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { vocabularyPracticeApi } from '@/api/vocabularyApi';
import { makeRound, makeSession } from '../testing/fixtures';
import { VocabularyTrainerScreen } from '../VocabularyTrainerScreen';

jest.mock('@/api/vocabularyApi');
const mockNavigate = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, push: mockPush, back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const getSession = vocabularyPracticeApi.getSession as jest.MockedFunction<typeof vocabularyPracticeApi.getSession>;
const submitRound = vocabularyPracticeApi.submitRound as jest.MockedFunction<typeof vocabularyPracticeApi.submitRound>;

const renderScreen = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { gcTime: Infinity } } })}>
      <VocabularyTrainerScreen />
    </QueryClientProvider>,
  );

const start = async () => fireEvent.press(await screen.findByRole('button', { name: 'Training starten' }));
const flip = async () => fireEvent.press(screen.getByRole('button', { name: /Karte umdrehen/ }));

describe('VocabularyTrainerScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('shows a skeleton, then the intro with the server counts', async () => {
    getSession.mockResolvedValue({ ...makeSession(3), newCount: 2, reviewCount: 1 });
    await renderScreen();
    expect(screen.getByLabelText('Training wird geladen')).toBeTruthy();
    expect(await screen.findByText('3 Wörter bereit')).toBeTruthy();
    expect(screen.getByText('2 neu · 1 zur Wiederholung')).toBeTruthy();
  });

  it('runs a full session with context questions and shows the summary', async () => {
    getSession.mockResolvedValue(makeSession(2));
    submitRound
      .mockResolvedValueOnce(makeRound({ correctContextKey: 'k1a' }))
      .mockResolvedValueOnce(makeRound({ flashcardCorrect: false, contextCorrect: false, correctContextKey: 'k2b' }));
    await renderScreen();
    await start();

    // Word 1: flip, "Gewusst", pick the right option
    expect(await screen.findByText('Wort 1 von 2')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Gewusst' })).toBeNull(); // not before flipping
    await flip();
    expect(screen.getByText('meaning 1')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Gewusst' }));
    expect(await screen.findByText('Ich suche ___ 1.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Option A1' }));
    expect(await screen.findByText(/✓ Gewusst · ✓ Kontext richtig/)).toBeTruthy();
    expect(screen.getByText('Stufe: Am Lernen')).toBeTruthy();
    expect(submitRound).toHaveBeenCalledWith({ vocabularyItemId: 'v1', flashcardKnewIt: true, contextSelectedKey: 'k1a' });
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));

    // Word 2: "Nicht gewusst", wrong option
    expect(await screen.findByText('Wort 2 von 2')).toBeTruthy();
    await flip();
    await fireEvent.press(screen.getByRole('button', { name: 'Nicht gewusst' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Option A2' }));
    expect(await screen.findByText(/✕ Nicht gewusst · ✕ Kontext nicht richtig/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Ergebnis ansehen' }));

    expect(await screen.findByText('Vocabulary-Training abgeschlossen')).toBeTruthy();
    expect(screen.getByText('1 von 2 richtig')).toBeTruthy();
    expect(screen.getByText('Erinnern: 50% · Kontext: 50%')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Zurück zum Dashboard' }));
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('flashcard-only round submits right after the self-grade', async () => {
    getSession.mockResolvedValue(makeSession(1, false));
    submitRound.mockResolvedValue(makeRound({ contextCorrect: null, correctContextKey: null }));
    await renderScreen();
    await start();
    expect(screen.queryByText(/Schritt/)).toBeNull();
    await flip();
    await fireEvent.press(screen.getByRole('button', { name: 'Gewusst' }));
    expect(await screen.findByText('✓ Gewusst')).toBeTruthy();
    expect(submitRound).toHaveBeenCalledWith({ vocabularyItemId: 'v1', flashcardKnewIt: true, contextSelectedKey: null });
  });

  it('keeps the answer and lets the learner retry when submitting fails', async () => {
    getSession.mockResolvedValue(makeSession(1));
    submitRound.mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.')).mockResolvedValueOnce(makeRound());
    await renderScreen();
    await start();
    await flip();
    await fireEvent.press(screen.getByRole('button', { name: 'Gewusst' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Option A1' }));
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: 'Option A1' })); // still tappable
    expect(await screen.findByText(/✓ Gewusst · ✓ Kontext richtig/)).toBeTruthy();
  });

  it('"Noch einmal" fetches a fresh session', async () => {
    getSession.mockResolvedValue(makeSession(1, false));
    submitRound.mockResolvedValue(makeRound({ contextCorrect: null, correctContextKey: null }));
    await renderScreen();
    await start();
    await flip();
    await fireEvent.press(screen.getByRole('button', { name: 'Gewusst' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Ergebnis ansehen' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Noch einmal' }));
    expect(await screen.findByText('1 Wörter bereit')).toBeTruthy();
    expect(getSession.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('shows an intentional empty state', async () => {
    getSession.mockResolvedValue({ items: [], newCount: 0, reviewCount: 0 });
    await renderScreen();
    expect(await screen.findByText('Noch keine Wörter zum Üben')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Zu Daily Words' }));
    expect(mockPush).toHaveBeenCalledWith('/learn/daily-words');
  });

  it('shows an error state with retry', async () => {
    getSession.mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'));
    await renderScreen();
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
    getSession.mockResolvedValueOnce(makeSession(2));
    await fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(await screen.findByText('2 Wörter bereit')).toBeTruthy();
  });
});
