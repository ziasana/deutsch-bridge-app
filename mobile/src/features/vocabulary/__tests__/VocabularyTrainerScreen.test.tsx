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

const getSession = vocabularyPracticeApi.getSession as jest.MockedFunction<
  typeof vocabularyPracticeApi.getSession
>;
const submitRound = vocabularyPracticeApi.submitRound as jest.MockedFunction<
  typeof vocabularyPracticeApi.submitRound
>;

const renderScreen = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { gcTime: Infinity } },
        })
      }
    >
      <VocabularyTrainerScreen />
    </QueryClientProvider>,
  );

const start = async () =>
  fireEvent.press(await screen.findByRole('button', { name: 'Start training' }));
const flip = async () => fireEvent.press(screen.getByRole('button', { name: /Flip the card/ }));

describe('VocabularyTrainerScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('shows a skeleton, then the intro with the server counts', async () => {
    getSession.mockResolvedValue({ ...makeSession(3), newCount: 2, reviewCount: 1 });
    await renderScreen();
    expect(screen.getByLabelText('Loading training')).toBeTruthy();
    expect(await screen.findByText('3 words ready')).toBeTruthy();
    expect(screen.getByText('2 new · 1 to review')).toBeTruthy();
  });

  it('runs a full session with context questions and shows the summary', async () => {
    getSession.mockResolvedValue(makeSession(2));
    submitRound
      .mockResolvedValueOnce(makeRound({ correctContextKey: 'k1a' }))
      .mockResolvedValueOnce(
        makeRound({ flashcardCorrect: false, contextCorrect: false, correctContextKey: 'k2b' }),
      );
    await renderScreen();
    await start();

    // Word 1: flip, "Gewusst", pick the right option
    expect(await screen.findByText('Word 1 of 2')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Knew it' })).toBeNull(); // not before flipping
    await flip();
    expect(screen.getByText('meaning 1')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Knew it' }));
    expect(await screen.findByText('Ich suche ___ 1.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Option A1' }));
    expect(await screen.findByText(/✓ Knew it · ✓ Context correct/)).toBeTruthy();
    expect(screen.getByText('Level: Learning')).toBeTruthy();
    expect(submitRound).toHaveBeenCalledWith({
      vocabularyItemId: 'v1',
      flashcardKnewIt: true,
      contextSelectedKey: 'k1a',
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    // Word 2: "Nicht gewusst", wrong option
    expect(await screen.findByText('Word 2 of 2')).toBeTruthy();
    await flip();
    await fireEvent.press(screen.getByRole('button', { name: "Didn't know" }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Option A2' }));
    expect(await screen.findByText(/✕ Didn't know · ✕ Context incorrect/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'See result' }));

    expect(await screen.findByText('Vocabulary training completed')).toBeTruthy();
    expect(screen.getByText('1 of 2 correct')).toBeTruthy();
    expect(screen.getByText('Recall: 50% · Context: 50%')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Back to dashboard' }));
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('shows the word type on the flashcard (front and back) and on the question step', async () => {
    const session = makeSession(1);
    session.items[0] = { ...session.items[0], wordType: 'IDIOM' };
    getSession.mockResolvedValue(session);
    await renderScreen();
    await start();

    expect(await screen.findByText('Idiom (Redewendung)')).toBeTruthy(); // front
    await flip();
    expect(screen.getByText('Idiom (Redewendung)')).toBeTruthy(); // back
    await fireEvent.press(screen.getByRole('button', { name: 'Knew it' }));
    expect(await screen.findByText('Ich suche ___ 1.')).toBeTruthy();
    expect(screen.getByText('Idiom (Redewendung)')).toBeTruthy(); // header badge
  });

  it('flashcard-only round submits right after the self-grade', async () => {
    getSession.mockResolvedValue(makeSession(1, false));
    submitRound.mockResolvedValue(makeRound({ contextCorrect: null, correctContextKey: null }));
    await renderScreen();
    await start();
    expect(screen.queryByText(/Step/)).toBeNull();
    await flip();
    await fireEvent.press(screen.getByRole('button', { name: 'Knew it' }));
    expect(await screen.findByText('✓ Knew it')).toBeTruthy();
    expect(submitRound).toHaveBeenCalledWith({
      vocabularyItemId: 'v1',
      flashcardKnewIt: true,
      contextSelectedKey: null,
    });
  });

  it('keeps the answer and lets the learner retry when submitting fails', async () => {
    getSession.mockResolvedValue(makeSession(1));
    submitRound
      .mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'))
      .mockResolvedValueOnce(makeRound());
    await renderScreen();
    await start();
    await flip();
    await fireEvent.press(screen.getByRole('button', { name: 'Knew it' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Option A1' }));
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: 'Option A1' })); // still tappable
    expect(await screen.findByText(/✓ Knew it · ✓ Context correct/)).toBeTruthy();
  });

  it('"Noch einmal" fetches a fresh session', async () => {
    getSession.mockResolvedValue(makeSession(1, false));
    submitRound.mockResolvedValue(makeRound({ contextCorrect: null, correctContextKey: null }));
    await renderScreen();
    await start();
    await flip();
    await fireEvent.press(screen.getByRole('button', { name: 'Knew it' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'See result' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Once more' }));
    expect(await screen.findByText('1 word ready')).toBeTruthy();
    expect(getSession.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('shows an intentional empty state', async () => {
    getSession.mockResolvedValue({ items: [], newCount: 0, reviewCount: 0 });
    await renderScreen();
    expect(await screen.findByText('No words to practise yet')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Go to Daily Words' }));
    expect(mockPush).toHaveBeenCalledWith('/learn/daily-words');
  });

  it('shows an error state with retry', async () => {
    getSession.mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'));
    await renderScreen();
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
    getSession.mockResolvedValueOnce(makeSession(2));
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('2 words ready')).toBeTruthy();
  });
});
