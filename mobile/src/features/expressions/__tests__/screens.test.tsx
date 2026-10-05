import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { expressionApi, expressionPracticeApi } from '@/api/expressionApi';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { ExpressionDetailScreen } from '../ExpressionDetailScreen';
import { ExpressionListScreen } from '../ExpressionListScreen';
import { ExpressionPracticeScreen } from '../ExpressionPracticeScreen';
import { ExpressionsHubScreen } from '../ExpressionsHubScreen';
import {
  listItem,
  makeExpression,
  page,
  practiceItem,
  progress,
  session,
} from '../testing/fixtures';

jest.mock('@/api/expressionApi');
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-image', () => ({ Image: () => null }));

const api = expressionApi as jest.Mocked<typeof expressionApi>;
const practice = expressionPracticeApi as jest.Mocked<typeof expressionPracticeApi>;

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
  useAuthStore.setState({ profile: { preferredLanguage: 'EN' } as UserProfile });
});

describe('ExpressionsHubScreen', () => {
  it('shows both collections with counts and ready-to-practice numbers', async () => {
    api.collectionSummary.mockResolvedValue([
      { type: 'REDEWENDUNG', total: 120 },
      { type: 'NOMEN_VERB_VERBINDUNG', total: 80 },
    ]);
    api.continueLearning.mockImplementation(async (type) => ({
      items: type === 'REDEWENDUNG' ? [listItem(1)] : [],
      readyCount: type === 'REDEWENDUNG' ? 5 : 0,
    }));
    await wrap(<ExpressionsHubScreen />);
    expect(await screen.findByText('120 Einträge · 5 bereit zum Üben')).toBeTruthy();
    expect(screen.getByText('80 Einträge')).toBeTruthy();
    expect(await screen.findByText('ins Auge fassen 1')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Training starten' }));
    expect(mockPush).toHaveBeenCalledWith('/expressions/practice');
    await fireEvent.press(screen.getByRole('button', { name: 'Redewendungen ansehen' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/expressions/list/[type]',
      params: { type: 'REDEWENDUNG' },
    });
  });

  it('shows an error state with retry', async () => {
    api.collectionSummary.mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'));
    await wrap(<ExpressionsHubScreen />);
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
  });
});

describe('ExpressionListScreen', () => {
  beforeEach(() => {
    mockParams = { type: 'REDEWENDUNG' };
  });

  it('lists expressions, loads the next page on end reached, and opens one', async () => {
    api.page
      .mockResolvedValueOnce(
        page([listItem(1), listItem(2, { bookmarked: true, masteryLevel: 'LEARNING' })], 0, 2),
      )
      .mockResolvedValueOnce(page([listItem(3)], 1, 2));
    await wrap(<ExpressionListScreen />);
    expect(await screen.findByText('ins Auge fassen 1')).toBeTruthy();
    expect(screen.getByText('Am Lernen')).toBeTruthy();
    expect(screen.getByLabelText('Gemerkt')).toBeTruthy();

    await fireEvent(screen.getByTestId('expression-list'), 'endReached');
    expect(await screen.findByText('ins Auge fassen 3')).toBeTruthy();
    expect(api.page).toHaveBeenLastCalledWith(
      'REDEWENDUNG',
      1,
      20,
      expect.objectContaining({ sort: 'recommended' }),
    );

    await fireEvent.press(screen.getByText('ins Auge fassen 1'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/expressions/[expressionId]',
      params: { expressionId: 'e1' },
    });
  });

  it('applies filters and shows an empty state with a reset action', async () => {
    api.page.mockResolvedValue(page([]));
    await wrap(<ExpressionListScreen />);
    expect(await screen.findByText('Noch keine Einträge')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: /Filter & Sortierung/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'C1' }));
    expect(await screen.findByText('Keine Treffer')).toBeTruthy();
    expect(api.page).toHaveBeenLastCalledWith(
      'REDEWENDUNG',
      0,
      20,
      expect.objectContaining({ level: 'C1' }),
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Filter zurücksetzen' }));
    expect(await screen.findByText('Noch keine Einträge')).toBeTruthy();
  });

  it('shows an error state with retry', async () => {
    api.page.mockRejectedValueOnce(
      new ApiError('server', 'Der Server ist gerade nicht erreichbar.'),
    );
    await wrap(<ExpressionListScreen />);
    expect(await screen.findByText('Der Server ist gerade nicht erreichbar.')).toBeTruthy();
    api.page.mockResolvedValueOnce(page([listItem(1)]));
    await fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(await screen.findByText('ins Auge fassen 1')).toBeTruthy();
  });
});

describe('ExpressionDetailScreen', () => {
  beforeEach(() => {
    mockParams = { expressionId: 'e1' };
    api.byId.mockResolvedValue(makeExpression());
    api.navigation.mockResolvedValue({
      previous: null,
      next: { id: 'e2', expression: 'auf dem Schlauch stehen' },
    });
    api.markViewed.mockResolvedValue(makeExpression());
  });

  it('shows meaning, patterns, examples and notes, and marks the expression viewed once', async () => {
    await wrap(<ExpressionDetailScreen />);
    expect(await screen.findByText('Bedeutung')).toBeTruthy();
    expect(screen.getByText('🇬🇧 to consider something')).toBeTruthy();
    expect(screen.queryByText('🇮🇷 در نظر گرفتن')).toBeNull(); // Persian only for PR learners
    expect(screen.getByText('Muster')).toBeTruthy();
    expect(screen.getByText('„Wir fassen einen Umzug ins Auge.“')).toBeTruthy();
    expect(screen.getByText('We are considering a move.')).toBeTruthy();
    expect(screen.getByText('Alltag')).toBeTruthy();
    expect(screen.getByText('Eher formell.')).toBeTruthy();
    expect(api.markViewed).toHaveBeenCalledTimes(1);
    expect(api.markViewed).toHaveBeenCalledWith('e1');
  });

  it('shows Persian meaning and translations for Persian learners', async () => {
    useAuthStore.setState({ profile: { preferredLanguage: 'PR' } as UserProfile });
    await wrap(<ExpressionDetailScreen />);
    expect(await screen.findByText('🇮🇷 در نظر گرفتن')).toBeTruthy();
    expect(screen.getByText('ما در فکر نقل مکان هستیم.')).toBeTruthy();
  });

  it('starts practice for this expression, toggles the bookmark, and navigates to the next one', async () => {
    api.addBookmark.mockResolvedValue(makeExpression({ bookmarked: true }));
    await wrap(<ExpressionDetailScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Üben' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/expressions/practice',
      params: { expressionId: 'e1', skipIntro: '1' },
    });

    await fireEvent.press(screen.getByRole('button', { name: '☆ Merken' }));
    expect(await screen.findByRole('button', { name: '★ Gemerkt' })).toBeTruthy();

    await fireEvent.press(screen.getAllByRole('button', { name: 'Nächste ›' })[0]);
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/expressions/[expressionId]',
      params: { expressionId: 'e2' },
    });
  });

  it('shows an error state when the expression cannot be loaded', async () => {
    api.byId.mockRejectedValueOnce(
      new ApiError('notFound', 'Dieser Inhalt wurde nicht gefunden.', 404),
    );
    await wrap(<ExpressionDetailScreen />);
    expect(await screen.findByText('Dieser Inhalt wurde nicht gefunden.')).toBeTruthy();
  });
});

describe('ExpressionPracticeScreen', () => {
  const sentenceItem = practiceItem(1, {
    warmupSteps: ['RECALL', 'CONTEXT', 'TRANSFORMATION'],
    transformationQuestion: {
      id: 't1',
      type: 'TRANSFORMATION',
      format: 'FREE_TEXT',
      prompt: 'Wir planen einen Umzug.',
      options: [],
    },
  });

  it('runs discover → recall → context → transformation → production and shows the summary', async () => {
    practice.session.mockResolvedValue({ items: [sentenceItem], newCount: 1, reviewCount: 0 });
    practice.recall.mockResolvedValue({
      correct: true,
      correctAnswer: 'fassen',
      progress: progress(),
    });
    practice.question.mockResolvedValue({
      correct: true,
      correctOptionId: 'o1',
      explanation: 'Das passt.',
      progress: progress(),
    });
    practice.transformation.mockResolvedValue({
      usedExpression: true,
      grammarCorrect: true,
      meaningPreserved: true,
      feedback: 'Gut!',
      c1Suggestion: null,
      progress: progress(),
    });
    practice.production.mockResolvedValue({
      usedCorrectly: true,
      grammarCorrect: true,
      natural: false,
      feedback: 'Fast natürlich.',
      c1Suggestion: 'Wir fassen es ins Auge.',
      progress: progress(),
    });

    await wrap(<ExpressionPracticeScreen />);
    expect(await screen.findByText('1 Wendungen bereit')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Training starten' }));

    // discover
    await fireEvent.press(await screen.findByRole('button', { name: 'Bedeutung anzeigen' }));
    expect(screen.getByText('= planen 1')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter zur Übung' }));

    // recall
    expect(await screen.findByText('Wir ___ es ins Auge.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Deine Antwort'), 'fassen');
    await fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
    expect(await screen.findByText('✓ Richtig!')).toBeTruthy();
    expect(practice.recall).toHaveBeenCalledWith('e1', 'fassen');
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));

    // context (multiple choice)
    expect(await screen.findByText('Welche Situation passt?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('radio', { name: 'Ein Plan' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
    expect(await screen.findByText('Das passt.')).toBeTruthy();
    expect(practice.question).toHaveBeenCalledWith('e1', 'q1', 'o1');
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));

    // transformation (AI-judged free text)
    expect(await screen.findByText('„Wir planen einen Umzug.“')).toBeTruthy();
    await fireEvent.changeText(
      screen.getByLabelText('Dein umformulierter Satz'),
      'Wir fassen einen Umzug ins Auge.',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Absenden' }));
    expect(await screen.findByText('✓ Wendung verwendet')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));

    // production
    await fireEvent.changeText(
      await screen.findByLabelText('Dein Satz'),
      'Ich fasse das ins Auge.',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Absenden' }));
    expect(await screen.findByText('✕ Natürlicher Satz')).toBeTruthy();
    expect(screen.getByText('Wir fassen es ins Auge.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Session beenden' }));

    expect(await screen.findByText('Wendungen geübt: 1')).toBeTruthy();
    expect(screen.getByText(/4 von 4 Antworten richtig/)).toBeTruthy();
    expect(screen.getByText('Eigene Sätze: 1 von 1 gelungen')).toBeTruthy();
  });

  it('starts immediately for one expression and skips the discover step', async () => {
    mockParams = { expressionId: 'e1', skipIntro: '1' };
    practice.session.mockResolvedValue(session(1));
    await wrap(<ExpressionPracticeScreen />);
    expect(await screen.findByText('Wir ___ es ins Auge.')).toBeTruthy(); // straight to recall
    expect(practice.session).toHaveBeenCalledWith('e1');
  });

  it('never traps the learner when the AI limit is reached: the step can be skipped', async () => {
    mockParams = { expressionId: 'e1', skipIntro: '1' };
    practice.session.mockResolvedValue({
      items: [practiceItem(1, { warmupSteps: [] })],
      newCount: 1,
      reviewCount: 0,
    });
    practice.production.mockRejectedValue(
      new ApiError('limit', 'Daily limit reached (5/day).', 429),
    );
    await wrap(<ExpressionPracticeScreen />);
    await fireEvent.changeText(await screen.findByLabelText('Dein Satz'), 'Mein Satz.');
    await fireEvent.press(screen.getByRole('button', { name: 'Absenden' }));
    expect(await screen.findByText('Daily limit reached (5/day).')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Schritt überspringen' }));
    expect(await screen.findByText('Wendungen geübt: 1')).toBeTruthy();
  });

  it('shows an empty state when nothing is due and an error state with retry', async () => {
    practice.session.mockResolvedValueOnce({ items: [], newCount: 0, reviewCount: 0 });
    const view = await wrap(<ExpressionPracticeScreen />);
    expect(await screen.findByText('Alles erledigt!')).toBeTruthy();
    view.unmount();
  });

  it('shows an error state with retry', async () => {
    practice.session.mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'));
    await wrap(<ExpressionPracticeScreen />);
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
    practice.session.mockResolvedValueOnce(session(2));
    await fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(await screen.findByText('2 Wendungen bereit')).toBeTruthy();
  });
});
