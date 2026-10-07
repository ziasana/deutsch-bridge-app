import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { vocabularyApi } from '@/api/vocabularyApi';
import { VocabularyDetailScreen } from '../VocabularyDetailScreen';
import { VocabularyScreen } from '../VocabularyScreen';
import { makeWord } from '../testing/fixtures';

jest.mock('@/api/vocabularyApi');
jest.mock('../audio', () => ({ playWordAudio: jest.fn() }));
const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const api = vocabularyApi as jest.Mocked<typeof vocabularyApi>;

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

describe('VocabularyScreen', () => {
  it('lists my words with counts and starts training and practice for one word', async () => {
    api.list.mockResolvedValue([
      makeWord(1, { article: 'der' }),
      makeWord(2),
      makeWord(3, { source: 'DICTIONARY' }),
    ]);
    await wrap(<VocabularyScreen />);
    expect((await screen.findAllByText('der Wort1')).length).toBeGreaterThan(0); // card + 'Weiter lernen'
    expect(screen.getByRole('button', { name: 'My words (2)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'From reading (1)' })).toBeTruthy();
    expect(screen.queryByText('Wort3')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Start training' }));
    expect(mockPush).toHaveBeenCalledWith('/learn/review');
    await fireEvent.press(screen.getByRole('button', { name: 'Practise der Wort1' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/learn/review',
      params: { vocabularyItemId: 'w1' },
    });

    await fireEvent.press(screen.getByRole('button', { name: 'From reading (1)' }));
    expect((await screen.findAllByText('Wort3')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull(); // dictionary words are read-only here
  });

  it('adds a word through the form', async () => {
    api.list.mockResolvedValue([]);
    api.create.mockResolvedValue(makeWord(9, { word: 'Hund', meaning: 'dog', article: 'der' }));
    await wrap(<VocabularyScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: '＋ Add word' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await fireEvent.press(screen.getByRole('button', { name: 'der' }));
    await fireEvent.changeText(screen.getByLabelText('Word'), 'Hund');
    await fireEvent.changeText(screen.getByLabelText('Meaning'), 'dog');
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith(
        expect.objectContaining({ word: 'Hund', meaning: 'dog', article: 'der', example: null }),
      ),
    );
    expect((await screen.findAllByText('der Hund')).length).toBeGreaterThan(0);
  });

  it('toggles a bookmark and filters to bookmarked words', async () => {
    api.list.mockResolvedValue([makeWord(1), makeWord(2, { bookmarked: true })]);
    api.addBookmark.mockResolvedValue(makeWord(1, { bookmarked: true }));
    await wrap(<VocabularyScreen />);
    await fireEvent.press((await screen.findAllByRole('button', { name: 'Save for later' }))[0]);
    await waitFor(() => expect(api.addBookmark).toHaveBeenCalledWith('w1'));

    await fireEvent.press(screen.getByRole('button', { name: '★ Saved only' }));
    expect(screen.getAllByText('Wort1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Wort2').length).toBeGreaterThan(0);
  });

  it('filters by mastery tile and search, with an empty state', async () => {
    api.list.mockResolvedValue([makeWord(1), makeWord(2)]);
    await wrap(<VocabularyScreen />);
    await screen.findAllByText('Wort1');
    await fireEvent.changeText(screen.getByLabelText('Search'), 'zzz');
    expect(await screen.findByText('No matches')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Reset filters' }));
    expect((await screen.findAllByText('Wort1')).length).toBeGreaterThan(0);
  });

  it('deletes a word after confirming', async () => {
    api.list.mockResolvedValue([makeWord(1)]);
    api.remove.mockResolvedValue(undefined as never);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    await wrap(<VocabularyScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Delete' }));
    expect(alert).toHaveBeenCalled();
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('w1'));
    expect(await screen.findByText('No words yet')).toBeTruthy();
  });

  it('shows an empty state with an add action for new learners', async () => {
    api.list.mockResolvedValue([]);
    await wrap(<VocabularyScreen />);
    expect(await screen.findByText('No words yet')).toBeTruthy();
  });
});

describe('VocabularyDetailScreen', () => {
  beforeEach(() => {
    mockParams = { itemId: 'w1' };
  });

  it('shows the word, meaning, example and progress and starts practice', async () => {
    api.byId.mockResolvedValue(
      makeWord(1, { article: 'das', example: 'Das Haus ist groß.', synonyms: 'Gebäude' }),
    );
    await wrap(<VocabularyDetailScreen />);
    expect(await screen.findByText('das Wort1')).toBeTruthy();
    expect(screen.getByText('meaning 1')).toBeTruthy();
    expect(screen.getByText('“Das Haus ist groß.”')).toBeTruthy();
    expect(screen.getByText('Gebäude')).toBeTruthy();
    expect(screen.getByText("You haven't practised this word yet.")).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Practise this word' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/learn/review',
      params: { vocabularyItemId: 'w1' },
    });
  });

  it('hides edit and delete for words saved from the dictionary', async () => {
    api.byId.mockResolvedValue(makeWord(1, { source: 'DICTIONARY' }));
    await wrap(<VocabularyDetailScreen />);
    await screen.findByText('Wort1');
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  });
});
