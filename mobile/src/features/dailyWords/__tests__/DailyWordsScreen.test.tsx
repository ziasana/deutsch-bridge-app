import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { dailyWordsApi } from '@/api/dailyWordsApi';
import { ApiError } from '@/api/errors';
import { vocabularyApi } from '@/api/vocabularyApi';
import { DailyWordsScreen } from '../DailyWordsScreen';
import { makeWords } from '../testing/fixtures';

jest.mock('@/api/dailyWordsApi');
jest.mock('@/api/vocabularyApi');
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, back: jest.fn(), push: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const getToday = dailyWordsApi.getToday as jest.MockedFunction<typeof dailyWordsApi.getToday>;
const markLearned = dailyWordsApi.markLearned as jest.MockedFunction<
  typeof dailyWordsApi.markLearned
>;
const exists = vocabularyApi.exists as jest.MockedFunction<typeof vocabularyApi.exists>;
const create = vocabularyApi.create as jest.MockedFunction<typeof vocabularyApi.create>;

const renderScreen = () =>
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
      <DailyWordsScreen />
    </QueryClientProvider>,
  );

describe('DailyWordsScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    exists.mockResolvedValue({ exists: false, vocabularyItemId: null });
    markLearned.mockResolvedValue({});
    create.mockResolvedValue({} as never);
  });

  it('shows a skeleton, then the first word with its details', async () => {
    getToday.mockResolvedValue(makeWords());
    await renderScreen();
    expect(screen.getByLabelText('Wörter werden geladen')).toBeTruthy();
    expect((await screen.findAllByText('berücksichtigen')).length).toBeGreaterThan(0); // word + highlighted in its example
    expect(screen.getByText('1 / 5')).toBeTruthy();
    expect(screen.getByText('meaning of berücksichtigen')).toBeTruthy();
    expect(screen.getByText('„Beispiel mit berücksichtigen.“')).toBeTruthy();
    expect(screen.getByText('beachten')).toBeTruthy();
    expect(screen.getByText('bedenken')).toBeTruthy();
  });

  it('speaks the word in German', async () => {
    getToday.mockResolvedValue(makeWords());
    await renderScreen();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Aussprache von berücksichtigen anhören' }),
    );
    expect(Speech.speak).toHaveBeenCalledWith('berücksichtigen', { language: 'de-DE' });
  });

  it('completes all 5 words, celebrates, runs the quiz and shows the result', async () => {
    getToday.mockResolvedValue(makeWords());
    await renderScreen();

    for (let i = 0; i < 4; i++) {
      await screen.findByText(`${i + 1} / 5`);
      await fireEvent.press(screen.getByRole('button', { name: 'Gelernt · Weiter' }));
    }
    await screen.findByText('5 / 5');
    await fireEvent.press(screen.getByRole('button', { name: 'Gelernt · Fertig' }));

    expect(markLearned).toHaveBeenCalledTimes(5);
    expect(markLearned).toHaveBeenLastCalledWith('w5');
    expect(await screen.findByText('Daily Words abgeschlossen')).toBeTruthy();
    expect(screen.getByText('5 / 5 Wörter gelernt')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Quiz starten' }));
    // Answer every question with the first option; the score depends on the shuffle, so just finish.
    for (let i = 1; i <= 5; i++) {
      await screen.findByText(`Frage ${i} von 5`);
      const options = screen.getAllByRole('radio');
      await fireEvent.press(options[0]);
      await fireEvent.press(
        screen.getByRole('button', { name: i === 5 ? 'Ergebnis ansehen' : 'Nächste Frage' }),
      );
    }
    expect(await screen.findByText('Daily Words – Quiz')).toBeTruthy();
    expect(screen.getByText(/von 5 richtig/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Zum Dashboard' }));
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('resumes on the first unlearned word', async () => {
    getToday.mockResolvedValue(makeWords([true, true, false, false, false]));
    await renderScreen();
    expect((await screen.findAllByText('verbessern')).length).toBeGreaterThan(0); // word + highlighted in its example
    expect(screen.getByText('3 / 5')).toBeTruthy();
  });

  it('goes straight to the celebration when everything is already learned', async () => {
    getToday.mockResolvedValue(makeWords([true, true, true, true, true]));
    await renderScreen();
    expect(await screen.findByText('Daily Words abgeschlossen')).toBeTruthy();
    // ...and the words can still be browsed again
    await fireEvent.press(screen.getByRole('button', { name: 'Wörter noch einmal ansehen' }));
    expect(await screen.findByText('1 / 5')).toBeTruthy();
    expect(screen.getAllByText('berücksichtigen').length).toBeGreaterThan(0);
    // "Weiter" steps through learned words (it must not jump back to the celebration)...
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));
    expect(await screen.findByText('2 / 5')).toBeTruthy();
    expect(markLearned).not.toHaveBeenCalled(); // browsing never re-marks words
  });

  it('celebrates after stepping past the last learned word when browsing again', async () => {
    getToday.mockResolvedValue(makeWords([true, true, true, true, true]));
    await renderScreen();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Wörter noch einmal ansehen' }),
    );
    for (let i = 1; i <= 4; i++) {
      await screen.findByText(`${i} / 5`);
      await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));
    }
    await screen.findByText('5 / 5');
    await fireEvent.press(screen.getByRole('button', { name: 'Fertig' }));
    expect(await screen.findByText('Daily Words abgeschlossen')).toBeTruthy();
  });

  it('keeps the word and shows the error when marking fails, then succeeds on retry', async () => {
    getToday.mockResolvedValue(makeWords());
    markLearned.mockRejectedValueOnce(
      new ApiError('server', 'Der Server ist gerade nicht erreichbar.'),
    );
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Gelernt · Weiter' }));
    expect(await screen.findByText('Der Server ist gerade nicht erreichbar.')).toBeTruthy();
    expect(screen.getByText('1 / 5')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Gelernt · Weiter' }));
    expect(await screen.findByText('2 / 5')).toBeTruthy();
  });

  it('saves to vocabulary and treats "already exists" as saved', async () => {
    getToday.mockResolvedValue(makeWords());
    create.mockRejectedValueOnce(
      new ApiError('validation', 'Vocabulary already exists for this word/language.', 400),
    );
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Zu Vocabulary hinzufügen' }));
    expect(await screen.findByRole('button', { name: '✓ In Vocabulary gespeichert' })).toBeTruthy();
  });

  it('shows an intentional empty state', async () => {
    getToday.mockResolvedValue([]);
    await renderScreen();
    expect(await screen.findByText('Heute keine neuen Wörter')).toBeTruthy();
  });

  it('shows an error state with retry', async () => {
    getToday.mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'));
    await renderScreen();
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
    getToday.mockResolvedValueOnce(makeWords());
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect((await screen.findAllByText('berücksichtigen')).length).toBeGreaterThan(0); // word + highlighted in its example
  });
});
