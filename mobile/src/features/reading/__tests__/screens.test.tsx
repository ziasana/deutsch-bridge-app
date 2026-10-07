import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { lexiconApi, readingApi, readingQuizApi } from '@/api/readingApi';
import { vocabularyApi } from '@/api/vocabularyApi';
import { I18nProvider } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { useReadingSessionStore } from '@/stores/readingSessionStore';
import type { UserProfile } from '@/types/user';
import { ReadingArticleScreen } from '../ReadingArticleScreen';
import { ReadingListScreen } from '../ReadingListScreen';
import { ReadingQuizScreen } from '../ReadingQuizScreen';
import { makeArticle, makeSummary } from '../testing/fixtures';

jest.mock('@/api/readingApi');
jest.mock('@/api/vocabularyApi');
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));

const api = readingApi as jest.Mocked<typeof readingApi>;
const mockedVocab = vocabularyApi as jest.Mocked<typeof vocabularyApi>;
const quiz = readingQuizApi as jest.Mocked<typeof readingQuizApi>;
const lexicon = lexiconApi as jest.Mocked<typeof lexiconApi>;

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
  useReadingSessionStore.setState({ articleId: null, tapped: [], saved: [] });
  useAuthStore.setState({
    profile: { learningLevel: 'B1', preferredLanguage: 'EN' } as UserProfile,
  });
});

const pageOf = (n: number) => ({
  items: Array.from({ length: n }, (_, i) => makeSummary(i + 1)),
  page: 0,
  size: 10,
  totalElements: n,
  totalPages: 1,
});

describe('ReadingListScreen', () => {
  it('opens on the learner level and lists articles', async () => {
    api.levelSummary.mockResolvedValue([
      { level: 'A2', total: 4, learned: 1 },
      { level: 'B1', total: 6, learned: 2 },
    ]);
    api.categories.mockResolvedValue([{ id: 'c1', title: 'Alltag' }]);
    api.page.mockResolvedValue(pageOf(2));
    await wrap(<ReadingListScreen />);

    expect(await screen.findByText('Artikel 1')).toBeTruthy();
    expect(api.page).toHaveBeenCalledWith(
      { level: 'B1', search: '', bookmarked: false, categoryId: '' },
      0,
      10,
    );
    expect(screen.getByRole('button', { name: 'B1 · 2/6' })).toBeTruthy();

    await fireEvent.press(screen.getByText('Artikel 2'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/reading/[articleId]',
      params: { articleId: 'r2' },
    });
  });

  it('refetches when the level changes', async () => {
    api.levelSummary.mockResolvedValue([
      { level: 'A2', total: 4, learned: 1 },
      { level: 'B1', total: 6, learned: 2 },
    ]);
    api.categories.mockResolvedValue([]);
    api.page.mockResolvedValue(pageOf(1));
    await wrap(<ReadingListScreen />);
    await screen.findByText('Artikel 1');
    await fireEvent.press(screen.getByRole('button', { name: 'A2 · 1/4' }));
    await waitFor(() =>
      expect(api.page).toHaveBeenCalledWith(expect.objectContaining({ level: 'A2' }), 0, 10),
    );
  });

  it('shows an empty state when a level has no texts', async () => {
    api.levelSummary.mockResolvedValue([{ level: 'B1', total: 0, learned: 0 }]);
    api.categories.mockResolvedValue([]);
    api.page.mockResolvedValue(pageOf(0));
    await wrap(<ReadingListScreen />);
    expect(await screen.findByText('No texts yet')).toBeTruthy();
  });

  it('shows an error state', async () => {
    api.levelSummary.mockRejectedValue(new ApiError('network', 'Keine Verbindung.'));
    api.page.mockRejectedValue(new ApiError('network', 'Keine Verbindung.'));
    api.categories.mockResolvedValue([]);
    await wrap(<ReadingListScreen />);
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
  });
});

describe('Persian interface', () => {
  it('shows the reading list in Persian when the profile language is PR', async () => {
    useAuthStore.setState({
      profile: { learningLevel: 'B1', preferredLanguage: 'PR' } as UserProfile,
    });
    api.levelSummary.mockResolvedValue([{ level: 'B1', total: 6, learned: 2 }]);
    api.categories.mockResolvedValue([]);
    api.page.mockResolvedValue(pageOf(1));
    await wrap(
      <I18nProvider>
        <ReadingListScreen />
      </I18nProvider>,
    );
    expect(await screen.findByText('Artikel 1')).toBeTruthy();
    expect(screen.getByText('متن‌هایی هم‌سطح خودتان بخوانید')).toBeTruthy();
    expect(screen.getByText('2 از 6')).toBeTruthy();
  });
});

describe('ReadingArticleScreen', () => {
  beforeEach(() => {
    mockParams = { articleId: 'r1' };
    api.navigation.mockResolvedValue({ previous: null, next: { id: 'r2', title: 'Zweiter' } });
    api.recordView.mockResolvedValue({ viewCount: 13 });
  });

  it('renders the text, counts the view and links to the next article', async () => {
    api.article.mockResolvedValue(makeArticle());
    await wrap(<ReadingArticleScreen />);
    expect(await screen.findByText('Key words', { exact: false })).toBeTruthy();
    expect(screen.getByText('2 new words')).toBeTruthy();
    await waitFor(() => expect(api.recordView).toHaveBeenCalledWith('r1'));

    await fireEvent.press(await screen.findByRole('button', { name: 'Next text ›' }));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/reading/[articleId]',
      params: { articleId: 'r2' },
    });
  });

  it('opens an annotation sheet, saves the word and tracks the tap', async () => {
    api.article.mockResolvedValue(makeArticle());
    lexicon.save.mockResolvedValue({});
    await wrap(<ReadingArticleScreen />);
    await fireEvent.press(await screen.findByText('Hund'));
    expect(await screen.findByText('dog')).toBeTruthy();
    expect(screen.getByText('Plural: Hunde')).toBeTruthy();
    expect(useReadingSessionStore.getState().tapped).toEqual(['Hund']);

    await fireEvent.press(screen.getByRole('button', { name: 'Save for review' }));
    await waitFor(() =>
      expect(lexicon.save).toHaveBeenCalledWith(
        expect.objectContaining({ lemma: 'Hund', articleId: 'r1', translation: 'dog' }),
        expect.anything(),
      ),
    );
    expect(await screen.findByText('✓ In your review list')).toBeTruthy();
    expect(useReadingSessionStore.getState().saved).toEqual(['Hund']);
  });

  it('toggles learned and bookmark', async () => {
    api.article.mockResolvedValue(makeArticle());
    api.setLearned.mockResolvedValue({});
    api.addBookmark.mockResolvedValue(makeArticle({ bookmarked: true }));
    await wrap(<ReadingArticleScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Mark as read' }));
    await waitFor(() => expect(api.setLearned).toHaveBeenCalledWith('r1', true));
    expect(await screen.findByRole('button', { name: '✓ Read' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: '☆ Save' }));
    await waitFor(() => expect(api.addBookmark).toHaveBeenCalledWith('r1'));
    expect(await screen.findByRole('button', { name: '★ Saved' })).toBeTruthy();
  });

  it('looks up any tapped word in the dictionary', async () => {
    api.article.mockResolvedValue(makeArticle());
    lexicon.lookup.mockResolvedValue({
      id: 'd1',
      lemma: 'laut',
      ipa: 'laʊt',
      audioUrl: null,
      article: null,
      savedByCurrentUser: false,
      senses: [{ id: 's1', pos: 'ADJ', translations: ['loud'], examples: [] }],
    } as never);
    await wrap(<ReadingArticleScreen />);
    await fireEvent.press(await screen.findByText('laut'));
    expect(await screen.findByText('loud')).toBeTruthy();
    expect(lexicon.lookup).toHaveBeenCalledWith('laut');
  });

  it('adds a looked-up word to the vocabulary and can remove it again', async () => {
    api.article.mockResolvedValue(makeArticle());
    lexicon.lookup.mockResolvedValue({
      id: 'd1',
      lemma: 'laut',
      ipa: null,
      audioUrl: null,
      article: null,
      savedByCurrentUser: false,
      senses: [{ id: 's1', pos: 'ADJ', translations: ['loud'], examples: [] }],
    } as never);
    mockedVocab.addFromDictionary.mockResolvedValue({});
    mockedVocab.listFromDictionary.mockResolvedValue([{ id: 'v9', dictionaryEntryId: 'd1' }]);
    mockedVocab.remove.mockResolvedValue(undefined as never);
    await wrap(<ReadingArticleScreen />);
    await fireEvent.press(await screen.findByText('laut'));
    await fireEvent.press(
      await screen.findByRole('button', { name: '＋ Add to vocabulary' }),
    );
    await waitFor(() => expect(mockedVocab.addFromDictionary).toHaveBeenCalledWith('d1'));

    await fireEvent.press(
      await screen.findByRole('button', { name: '✓ In vocabulary – remove' }),
    );
    await waitFor(() => expect(mockedVocab.remove).toHaveBeenCalledWith('v9'));
    expect(
      await screen.findByRole('button', { name: '＋ Add to vocabulary' }),
    ).toBeTruthy();
  });

  it('shows an error state when the article fails to load', async () => {
    api.article.mockRejectedValue(new ApiError('network', 'Keine Verbindung.'));
    await wrap(<ReadingArticleScreen />);
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
  });
});

describe('ReadingQuizScreen', () => {
  const questions = [
    {
      id: 'q1',
      type: 'HAUPTIDEE' as const,
      prompt: 'Worum geht es?',
      options: ['Hunde', 'Katzen'],
    },
    { id: 'q2', type: 'DETAIL' as const, prompt: 'Was ist laut?', options: null },
  ];

  beforeEach(() => {
    mockParams = { articleId: 'r1' };
    api.article.mockResolvedValue(makeArticle());
    quiz.start.mockResolvedValue({ attemptId: 'at1', questions });
    useReadingSessionStore.setState({ articleId: 'r1', tapped: ['Hund'], saved: [] });
  });

  it('runs the quiz, saves the tested word, and reports the session on completion', async () => {
    lexicon.save.mockResolvedValue({});
    quiz.answer
      .mockResolvedValueOnce({
        correct: false,
        correctAnswer: 'Hunde',
        explanation: 'Es geht um einen Hund.',
        supportingSentence: 'Der Hund bellt laut.',
        relatedLemma: 'Hund',
      })
      .mockResolvedValueOnce({
        correct: true,
        correctAnswer: 'Hund',
        explanation: '',
        supportingSentence: '',
        relatedLemma: null,
      });
    quiz.complete.mockResolvedValue({
      attemptId: 'at1',
      comprehensionScore: 90,
      vocabScore: 60,
      recommendation: {
        type: 'CONTINUE',
        suggestedArticleId: 'r9',
        suggestedTitle: 'Neuer Text',
        suggestedLevel: 'B1',
        message: 'Weiter so!',
      },
    });
    await wrap(<ReadingQuizScreen />);

    expect(await screen.findByText('Question 1 of 2')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('radio', { name: 'Katzen' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Check answer' }));
    expect(await screen.findByText('✕ Not correct')).toBeTruthy();
    expect(screen.getByText('Correct answer: Hunde')).toBeTruthy();
    expect(quiz.answer).toHaveBeenCalledWith('at1', 'q1', 'Katzen');
    await waitFor(() =>
      expect(lexicon.save).toHaveBeenCalledWith(
        expect.objectContaining({ lemma: 'Hund' }),
        expect.anything(),
      ),
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Next question' }));
    expect(await screen.findByText('Question 2 of 2')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Your answer'), 'Hund');
    await fireEvent.press(screen.getByRole('button', { name: 'Check answer' }));
    expect(await screen.findByText('✓ Correct!')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'See result' }));
    await waitFor(() => expect(quiz.complete).toHaveBeenCalledWith('at1', ['Hund'], ['Hund']));
    expect(await screen.findByText('Very good!')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Continue: Neuer Text' }));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/reading/[articleId]',
      params: { articleId: 'r9' },
    });
  });

  it('shows an empty state when the text has no questions', async () => {
    quiz.start.mockResolvedValue({ attemptId: 'at1', questions: [] });
    await wrap(<ReadingQuizScreen />);
    expect(await screen.findByText('No quiz yet')).toBeTruthy();
  });

  it('retries after a failed start', async () => {
    quiz.start.mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'));
    await wrap(<ReadingQuizScreen />);
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Question 1 of 2')).toBeTruthy();
  });
});
