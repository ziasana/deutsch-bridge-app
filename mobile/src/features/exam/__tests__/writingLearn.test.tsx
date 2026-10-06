import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { writingApi } from '@/api/writingApi';
import type { WritingGuideItem, WritingLearningResponse } from '@/types/writing';
import { WritingLearnScreen } from '../writing/WritingLearnScreen';
import { buildStations } from '../writing/learn/stations';

jest.mock('@/api/writingApi');
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ level: 'B1' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/utils/germanSpeech', () => ({ speakGerman: jest.fn(() => jest.fn()) }));

const api = writingApi as jest.Mocked<typeof writingApi>;

const item = (id: string, kind: WritingGuideItem['kind'], title: string, extra: Partial<WritingGuideItem> = {}): WritingGuideItem => ({
  id,
  kind,
  title,
  content: null,
  data: null,
  sortOrder: 0,
  ...extra,
});

const DATA: WritingLearningResponse = {
  level: 'B1',
  phrases: [],
  items: [
    item('f1', 'FORMAT', 'Die Aufgabe', { content: 'Du schreibst eine E-Mail.', data: { time: '30 Min.', requirements: ['Anrede', 'Gruß'] } }),
    item('m1', 'MISTAKE', 'Anrede', { content: 'Nach der Anrede kommt ein Komma.', data: { wrong: 'Hallo Anna!', right: 'Hallo Anna,' } }),
    item('c1', 'CHECKLIST_ITEM', 'Habe ich alle Leitpunkte?'),
  ],
};

const wrap = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}>
      {ui}
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.resetAllMocks();
  api.learning.mockResolvedValue(DATA);
  api.learnProgress.mockResolvedValue([]);
  api.saveLearnProgress.mockResolvedValue({ station: 'fehler', correct: 1, total: 1 });
});

describe('buildStations', () => {
  it('builds only stations that have content, in learning order', () => {
    expect(buildStations(DATA, 'B1').map((s) => s.id)).toEqual(['format', 'fehler', 'checkliste']);
  });
});

describe('WritingLearnScreen', () => {
  it('shows the learning path with progress synced from the server', async () => {
    api.learnProgress.mockResolvedValue([{ station: 'format', correct: 0, total: 0 }]);
    await wrap(<WritingLearnScreen />);

    expect(await screen.findByText('Weiter so!')).toBeTruthy();
    expect(screen.getByText(/1 von 3 Stationen/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '1. Prüfungsformat, geschafft' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Weiterlernen: Typische Fehler' })).toBeTruthy();
  });

  it('gates quiz steps, scores the lesson and saves the result', async () => {
    await wrap(<WritingLearnScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Starten: Prüfungsformat' }));

    // Format: intro slide → gated checklist.
    await fireEvent.press(await screen.findByRole('button', { name: 'Weiter' }));
    expect(screen.getByRole('button', { name: 'Abschließen' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Anrede' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Gruß' }));
    expect(screen.getByRole('button', { name: 'Abschließen' })).toBeEnabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Abschließen' }));

    expect(await screen.findByText('Ausgezeichnet!')).toBeTruthy();
    await waitFor(() => expect(api.saveLearnProgress).toHaveBeenCalledWith('B1', 'format', 0, 0));
    expect(screen.getByRole('button', { name: 'Weiter: Typische Fehler' })).toBeTruthy();
  });

  it('counts a first-try right answer in a quiz and a wrong one against the score', async () => {
    api.learnProgress.mockResolvedValue([{ station: 'format', correct: 0, total: 0 }]);
    await wrap(<WritingLearnScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Weiterlernen: Typische Fehler' }));

    const options = await screen.findAllByRole('radio');
    expect(options).toHaveLength(2);
    // Pick the wrong version first: it can not be changed afterwards.
    await fireEvent.press(screen.getByRole('radio', { name: 'Hallo Anna!' }));
    expect(screen.getByText('Nach der Anrede kommt ein Komma.')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Hallo Anna,' })).toBeDisabled();

    await fireEvent.press(screen.getByRole('button', { name: 'Abschließen' }));
    await waitFor(() => expect(api.saveLearnProgress).toHaveBeenCalledWith('B1', 'fehler', 0, 1));
  });

  it('shows an empty state when the level has no content', async () => {
    api.learning.mockResolvedValue({ level: 'B1', items: [], phrases: [] });
    await wrap(<WritingLearnScreen />);
    expect(await screen.findByText('Noch keine Lerninhalte')).toBeTruthy();
  });
});
