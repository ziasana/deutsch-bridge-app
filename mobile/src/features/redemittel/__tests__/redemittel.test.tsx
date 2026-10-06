import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { redemittelApi } from '@/api/redemittelApi';
import { RedemittelDetailScreen } from '../DetailScreen';
import { RedemittelHubScreen } from '../HubScreen';
import { RedemittelLearnScreen } from '../LearnScreen';
import { SessionScreen } from '../SessionScreen';
import { recommendedStep } from '../meta';
import { answer, choice, makeHub, makeRedemittel, page, wordOrder } from '../testing/fixtures';

jest.mock('@/api/redemittelApi');
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockNavigate = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    navigate: mockNavigate,
    back: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const api = redemittelApi as jest.Mocked<typeof redemittelApi>;

const wrap = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false, gcTime: Infinity },
            mutations: { gcTime: Infinity },
          },
        })
      }
    >
      {ui}
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.resetAllMocks();
  mockParams = {};
});

describe('recommendedStep', () => {
  const base = { dueCount: 0, newToday: 0, summary: { learned: 0 }, savedCount: 0 };
  it('prefers reviews, then new, then practice', () => {
    expect(recommendedStep({ ...base, dueCount: 1, newToday: 2 })).toBe('review');
    expect(recommendedStep({ ...base, newToday: 2 })).toBe('learn');
    expect(recommendedStep({ ...base, savedCount: 1 })).toBe('practice');
    expect(recommendedStep(base)).toBeNull();
  });
});

describe('RedemittelHubScreen', () => {
  beforeEach(() => {
    api.hub.mockResolvedValue(makeHub());
    api.today.mockResolvedValue([makeRedemittel(8)]);
    api.page.mockResolvedValue(
      page([makeRedemittel(1), makeRedemittel(2, { saved: true, status: 'MASTERED' })]),
    );
  });

  it('shows the day steps, the list, and opens a Redemittel', async () => {
    await wrap(<RedemittelHubScreen />);
    expect(await screen.findByText('Meiner Meinung nach 1')).toBeTruthy();
    expect(screen.getByText('2 Redemittel auffrischen')).toBeTruthy();
    expect(screen.getByText('3 neue Redemittel')).toBeTruthy();
    expect(screen.getByText('Als Nächstes')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Wiederholen' }));
    expect(mockPush).toHaveBeenCalledWith('/redemittel/review');
    await fireEvent.press(screen.getByRole('button', { name: 'Lernen' }));
    expect(mockPush).toHaveBeenCalledWith('/redemittel/learn');

    await fireEvent.press(screen.getByText('Meiner Meinung nach 1'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/redemittel/[id]', params: { id: 'r1' } });
  });

  it('filters by status tile, level, saved collection and category', async () => {
    await wrap(<RedemittelHubScreen />);
    await screen.findByText('Meiner Meinung nach 1');
    await fireEvent.press(screen.getByRole('button', { name: 'Sicher: 1' }));
    await waitFor(() =>
      expect(api.page).toHaveBeenLastCalledWith(
        0,
        12,
        expect.objectContaining({ status: 'MASTERED' }),
      ),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'B2' }));
    await waitFor(() =>
      expect(api.page).toHaveBeenLastCalledWith(0, 12, expect.objectContaining({ level: 'B2' })),
    );
    await fireEvent.press(screen.getByRole('button', { name: /Meine Sammlung/ }));
    await waitFor(() =>
      expect(api.page).toHaveBeenLastCalledWith(0, 12, expect.objectContaining({ saved: true })),
    );
    await fireEvent.press(screen.getByRole('button', { name: /Meinung · 7/ }));
    await waitFor(() =>
      expect(api.page).toHaveBeenLastCalledWith(
        0,
        12,
        expect.objectContaining({ category: 'OPINION' }),
      ),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Filter zurücksetzen' }));
    // back to the unfiltered (cached) list: the reset link is gone again
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Filter zurücksetzen' })).toBeNull(),
    );
  });

  it('saves a Redemittel from the list', async () => {
    api.save.mockResolvedValue(makeRedemittel(1, { saved: true }));
    await wrap(<RedemittelHubScreen />);
    await fireEvent.press(
      (await screen.findAllByRole('button', { name: 'Zu meinen Redemitteln hinzufügen' }))[0],
    );
    await waitFor(() => expect(api.save).toHaveBeenCalledWith('r1'));
  });

  it('shows an error state with retry', async () => {
    api.page.mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'));
    await wrap(<RedemittelHubScreen />);
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
  });
});

describe('RedemittelLearnScreen', () => {
  it('learns today’s Redemittel one by one and offers practice for them', async () => {
    api.today.mockResolvedValue([makeRedemittel(1), makeRedemittel(2)]);
    api.learn.mockImplementation(async (id) =>
      makeRedemittel(Number(id.slice(1)), { status: 'LEARNING' }),
    );
    await wrap(<RedemittelLearnScreen />);
    expect(await screen.findByText('Redemittel 1 von 2')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Verstanden – weiter' }));
    expect(await screen.findByText('Redemittel 2 von 2')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Verstanden – abschließen' }));
    expect(await screen.findByText('Du hast heute 2 Redemittel gelernt.')).toBeTruthy();
    expect(api.learn).toHaveBeenCalledTimes(2);

    await fireEvent.press(screen.getByRole('button', { name: 'Jetzt üben' }));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/redemittel/practice',
      params: { ids: 'r1,r2' },
    });
  });

  it('shows an empty state when everything is learned', async () => {
    api.today.mockResolvedValue([]);
    await wrap(<RedemittelLearnScreen />);
    expect(await screen.findByText('Alles gelernt für heute')).toBeTruthy();
  });
});

describe('SessionScreen', () => {
  it('runs a review: choice answer, feedback with next review, then the summary', async () => {
    api.reviewSession.mockResolvedValue({ exercises: [choice(1), wordOrder(2)], total: 2 });
    api.answerReview.mockResolvedValue(answer());
    await wrap(<SessionScreen mode="review" />);
    expect(await screen.findByText('Was bedeutet Redemittel 1?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Antwort A' }));
    expect(await screen.findByText('✓ Richtig!')).toBeTruthy();
    expect(screen.getByText('Nächste Wiederholung: in 3 Tagen')).toBeTruthy();
    expect(api.answerReview).toHaveBeenCalledWith('r1', 'e1', 'a');

    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));
    // word order: tap the words in order, then check
    for (const w of ['Ich', 'stimme', 'zu'])
      await fireEvent.press(screen.getByRole('button', { name: w }));
    api.answerReview.mockResolvedValue(answer({ correct: false, correctAnswer: 'Ich stimme zu' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
    await waitFor(() =>
      expect(api.answerReview).toHaveBeenLastCalledWith('r2', 'w2', 'Ich stimme zu'),
    );
    expect(await screen.findByText('✗ Noch einmal üben')).toBeTruthy();
    expect(screen.getByText('Dieses Redemittel wird morgen erneut wiederholt.')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Fertig' }));
    expect(await screen.findByText('1 von 2 Antworten waren richtig.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Zur Übersicht' }));
    expect(mockNavigate).toHaveBeenCalledWith('/learn/redemittel');
  });

  it('passes the ids of freshly learned Redemittel to practice', async () => {
    mockParams = { ids: 'r1,r2' };
    api.practiceSession.mockResolvedValue({ exercises: [], total: 0 });
    await wrap(<SessionScreen mode="practice" />);
    expect(await screen.findByText('Noch nichts zu üben')).toBeTruthy();
    expect(api.practiceSession).toHaveBeenCalledWith(['r1', 'r2']);
  });
});

describe('RedemittelDetailScreen', () => {
  it('shows only the sections that were authored and toggles the collection', async () => {
    mockParams = { id: 'r1' };
    api.byId.mockResolvedValue(
      makeRedemittel(1, {
        usageNote: 'Eher formell.',
        similarExpressions: ['Ich finde, dass …'],
        commonMistake: 'Nicht „nach meiner Meinung“.',
      }),
    );
    api.save.mockResolvedValue(makeRedemittel(1, { saved: true }));
    await wrap(<RedemittelDetailScreen />);
    expect(await screen.findByText('In my opinion 1')).toBeTruthy();
    expect(screen.getByText('Eher formell.')).toBeTruthy();
    expect(screen.queryByText('GRAMMATIK / STRUKTUR')).toBeNull();
    // collapsible sections stay closed until asked for
    expect(screen.queryByText('• Ich finde, dass …')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Anzeigen – Ähnliche Redemittel' }));
    expect(screen.getByText('• Ich finde, dass …')).toBeTruthy();

    // the save-for-practice button sits in the card itself, with a hint what it is for
    expect(screen.getByText(/Speichere es, um es zu üben/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Zu meinen Redemitteln' }));
    await waitFor(() => expect(api.save).toHaveBeenCalledWith('r1'));
    expect(await screen.findByText(/Du kannst dieses Redemittel jetzt üben/)).toBeTruthy();
  });
});
