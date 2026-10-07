import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, AppState } from 'react-native';
import { ApiError } from '@/api/errors';
import { examApi } from '@/api/examApi';
import { examTimeApi } from '@/api/examTimeApi';
import { writingApi } from '@/api/writingApi';
import type { WritingAttempt, WritingFeedback } from '@/types/writing';
import { ExamExerciseScreen } from '../ExamExerciseScreen';
import { ExamTeilScreen } from '../ExamTeilScreen';
import { ZeitmanagementScreen } from '../ZeitmanagementScreen';
import { exercise, passage, summary } from '../testing/fixtures';
import { useExamTimerStore } from '../time/timerStore';
import { clearExamLocalData } from '../localData';
import { diffWords } from '../writing/wordDiff';

jest.mock('@/api/examApi');
jest.mock('@/api/examTimeApi');
jest.mock('@/api/writingApi');
const mockPush = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-image', () => ({ Image: () => null }));

const api = examApi as jest.Mocked<typeof examApi>;
const time = examTimeApi as jest.Mocked<typeof examTimeApi>;
const writing = writingApi as jest.Mocked<typeof writingApi>;

const wrap = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } })}
    >
      {ui}
    </QueryClientProvider>,
  );

const feedback = (over: Partial<WritingFeedback> = {}): WritingFeedback => ({
  source: 'RULES',
  dimensions: [
    { key: 'TASK', title: 'Aufgabenerfüllung', status: 'IMPROVE', positives: [], improvements: ['Gehe auf alle Punkte ein.'] },
    { key: 'FORM', title: 'Form', status: 'GOOD', positives: ['Anrede vorhanden.'], improvements: [] },
  ],
  highlights: ['Gute Einleitung'],
  nextFocus: ['Verbindungswörter nutzen'],
  stats: { wordCount: 5, sentenceCount: 1, paragraphCount: 1, connectorCount: 0, usedPhrases: [], uncoveredLeitpunkte: [] },
  ...over,
});

const attempt = (n: number, text: string, over: Partial<WritingAttempt> = {}): WritingAttempt => ({
  id: `a${n}`,
  exerciseId: 'w1',
  mode: 'PRACTICE',
  text,
  planNotes: [],
  wordCount: text.split(/\s+/).length,
  attemptNumber: n,
  parentAttemptId: n > 1 ? `a${n - 1}` : null,
  submittedAt: '2026-01-01T10:00:00Z',
  feedback: feedback(),
  aiFeedback: null,
  ...over,
});

const writingExercise = (over = {}) =>
  exercise({
    id: 'w1',
    section: 'SCHRIFTLICHER_AUSDRUCK',
    taskType: 'WRITING_TASK',
    questions: [],
    passages: [passage('p1', { content: 'Schreibe eine E-Mail.' })],
    requiresPlanning: false,
    leitpunkte: ['Grund', 'Wunsch'],
    modelSolution: 'Sehr geehrte Damen und Herren, ...',
    ...over,
  });

beforeEach(async () => {
  jest.resetAllMocks();
  await AsyncStorage.clear();
  mockParams = { exerciseId: 'w1' };
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() } as never);
  api.markCompleted.mockResolvedValue(undefined);
  time.configurations.mockResolvedValue([]);
  time.lastTimes.mockResolvedValue([]);
  writing.attempts.mockResolvedValue([]);
  useExamTimerStore.setState({ active: null, lastResult: null, hasHydrated: true });
});

describe('Schreiben', () => {
  it('writes, autosaves a draft, confirms, submits and shows feedback', async () => {
    api.byId.mockResolvedValue(writingExercise());
    time.startSession.mockResolvedValue({
      id: 'ps', scope: 'EXERCISE', mode: 'TIME_TRAINING', section: 'SCHRIFTLICHER_AUSDRUCK', level: 'B1', teil: 2, exerciseId: 'w1', startedAt: '', targetSeconds: 1800,
    });
    time.completeSession.mockResolvedValue({
      id: 'ps', scope: 'EXERCISE', mode: 'TIME_TRAINING', section: 'SCHRIFTLICHER_AUSDRUCK', level: 'B1', teil: 2, elapsedSeconds: 1500, targetSeconds: 1800, differenceSeconds: -300, questionsTotal: 0, questionsAnswered: 0, correctAnswers: 0, score: null,
    });
    writing.submit.mockResolvedValue(attempt(1, 'Sehr geehrte Frau Müller bitte helfen'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.text === 'Abgeben')?.onPress?.();
    });
    await wrap(<ExamExerciseScreen />);

    const field = await screen.findByLabelText('Deine Antwort');
    expect(screen.getByRole('button', { name: 'Abgeben' })).toBeDisabled();
    await fireEvent.changeText(field, 'Sehr geehrte Frau Müller bitte helfen');
    expect(screen.getByText('Wörter: 6')).toBeTruthy();
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem('writing-draft-w1')) ?? '{}').text).toBe('Sehr geehrte Frau Müller bitte helfen'),
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Abgeben' }));
    expect(alert).toHaveBeenCalled();
    await waitFor(() =>
      expect(writing.submit).toHaveBeenCalledWith({
        exerciseId: 'w1',
        text: 'Sehr geehrte Frau Müller bitte helfen',
        mode: 'PRACTICE',
        planNotes: ['', ''],
        parentAttemptId: null,
      }),
    );
    expect(await screen.findByText('✅ Text abgegeben')).toBeTruthy();
    expect(screen.getByText('👍 Das hast du gut gemacht')).toBeTruthy();
    expect(screen.getByText('Gehe auf alle Punkte ein.', { exact: false })).toBeTruthy(); // IMPROVE opens by default
    await waitFor(() => expect(api.markCompleted).toHaveBeenCalledWith('w1'));
    expect(await screen.findByText('25:00')).toBeTruthy(); // Zeit-Check
    expect(await AsyncStorage.getItem('writing-draft-w1')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Mögliche Lösung anzeigen' }));
    expect(screen.getByText(/Sehr geehrte Damen und Herren/)).toBeTruthy();
  });

  it('asks for a plan first when the task requires planning, and keeps the notes visible', async () => {
    api.byId.mockResolvedValue(writingExercise({ requiresPlanning: true }));
    await wrap(<ExamExerciseScreen />);
    expect(await screen.findByText('📝 Plane deinen Text')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Grund'), 'Heizung kaputt');
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter zum Schreiben' }));
    expect(await screen.findByLabelText('Deine Antwort')).toBeTruthy();
    expect(screen.getByText('• Grund – Heizung kaputt')).toBeTruthy();
  });

  it('hides help in exam mode and loads it on demand otherwise', async () => {
    api.byId.mockResolvedValue(writingExercise());
    writing.learning.mockResolvedValue({
      level: 'B1',
      items: [
        { id: 'i1', kind: 'STRATEGY_STEP', title: 'Aufgabe lesen', content: 'Lies genau.', data: { tips: ['Markiere Leitpunkte'] }, sortOrder: 1 },
      ],
      phrases: [
        { id: 'p1', category: 'wunsch', categoryLabel: 'Wunsch', phrase: 'Ich würde gern …', explanation: null, example: null, formality: 'FORMAL', usageNote: null, sortOrder: 1 },
      ],
    });
    await wrap(<ExamExerciseScreen />);
    await screen.findByLabelText('Deine Antwort');
    expect(writing.learning).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Hilfe' }));
    expect(await screen.findByText('Lies genau.')).toBeTruthy();
    expect(writing.learning).toHaveBeenCalledWith('B1');
    await fireEvent.press(screen.getByRole('button', { name: '💬 Redemittel' }));
    expect(await screen.findByText(/Ich würde gern/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: '📖 Beispiel' })).toBeNull(); // Üben has only Tipp + Redemittel
    await fireEvent.press(screen.getAllByRole('button', { name: 'Close' })[0]);

    await fireEvent.press(screen.getByRole('button', { name: 'Prüfung' }));
    expect(screen.queryByRole('button', { name: 'Hilfe' })).toBeNull();
  });

  it('requests AI feedback and shows the daily-limit message when it is reached', async () => {
    api.byId.mockResolvedValue(writingExercise());
    writing.attempts.mockResolvedValue([attempt(1, 'Mein Text ist kurz')]);
    writing.aiFeedback
      .mockRejectedValueOnce(new ApiError('limit', 'Tageslimit für KI-Korrekturen erreicht.', 429))
      .mockResolvedValueOnce(
        attempt(1, 'Mein Text ist kurz', {
          aiFeedback: {
            positives: ['Klar formuliert'], missingPoints: [], vocabulary: [], structure: [], improvementExample: null,
            grammar: [{ original: 'ich bin kurz', corrected: 'ich fasse mich kurz', explanation: 'Reflexiv' }],
          },
        }),
      );
    await wrap(<ExamExerciseScreen />);
    expect(await screen.findByText('✅ Text abgegeben')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: '🤖 KI-Feedback anfordern' }));
    expect(await screen.findByText('Daily limit reached')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: '🤖 KI-Feedback anfordern' }));
    expect(await screen.findByText('🤖 KI-Feedback')).toBeTruthy();
    expect(screen.getByText('Klar formuliert', { exact: false })).toBeTruthy();
  });

  it('revises a text as a new attempt and compares the versions', async () => {
    api.byId.mockResolvedValue(writingExercise());
    writing.attempts.mockResolvedValue([attempt(1, 'Ich habe ein Problem')]);
    writing.submit.mockResolvedValue(attempt(2, 'Ich habe ein großes Problem'));
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.text === 'Abgeben')?.onPress?.();
    });
    await wrap(<ExamExerciseScreen />);
    await screen.findByText('✅ Text abgegeben');

    await fireEvent.press(screen.getByRole('button', { name: 'Text überarbeiten' }));
    const field = await screen.findByLabelText('Deine Antwort');
    expect(field.props.value).toBe('Ich habe ein Problem'); // starts from the last submitted text
    await fireEvent.changeText(field, 'Ich habe ein großes Problem');
    await fireEvent.press(screen.getByRole('button', { name: 'Abgeben' }));
    await waitFor(() =>
      expect(writing.submit).toHaveBeenCalledWith(expect.objectContaining({ parentAttemptId: 'a1' })),
    );

    expect(await screen.findByText('Versuch 2 · 5 Wörter')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Original vs. Überarbeitung' }));
    expect(await screen.findByText('ORIGINAL')).toBeTruthy();
    expect(screen.getByText('ÜBERARBEITUNG')).toBeTruthy();
    expect(screen.getByText('Wörter')).toBeTruthy();
  });

  it('shows an error and keeps the text when submitting fails', async () => {
    api.byId.mockResolvedValue(writingExercise());
    writing.submit.mockRejectedValue(new ApiError('network', 'Keine Verbindung.'));
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.text === 'Abgeben')?.onPress?.();
    });
    await wrap(<ExamExerciseScreen />);
    await fireEvent.changeText(await screen.findByLabelText('Deine Antwort'), 'Hallo Welt');
    await fireEvent.press(screen.getByRole('button', { name: 'Abgeben' }));
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
    expect(screen.getByLabelText('Deine Antwort').props.value).toBe('Hallo Welt');
  });
});

describe('wordDiff', () => {
  it('marks removed and added words and keeps whitespace', () => {
    const parts = diffWords('Ich habe ein Problem', 'Ich habe ein großes Problem');
    expect(parts.map((p) => [p.kind, p.text])).toEqual([
      ['same', 'Ich habe ein '],
      ['added', 'großes '],
      ['same', 'Problem'],
    ]);
    expect(diffWords('a b', 'a b').every((p) => p.kind === 'same')).toBe(true);
    expect(diffWords('x', 'y').map((p) => p.kind).sort()).toEqual(['added', 'removed']);
  });
});

describe('timing screens', () => {
  it('shows the Teil time card with recommended minutes and last times per exercise', async () => {
    mockParams = { section: 'LESEVERSTEHEN', level: 'B1', part: '1' };
    api.exercisesForLevel.mockResolvedValue([summary('a', { title: '1. Übung', teil: 1 }), summary('b', { title: '2. Übung', teil: 1 })]);
    time.configurations.mockResolvedValue([{ examType: 'TELC', level: 'B1', section: 'LESEVERSTEHEN', teil: 1, recommendedMinutes: 15 }]);
    time.lastTimes.mockResolvedValue([{ exerciseId: 'a', elapsedSeconds: 600, targetSeconds: 900 }]);
    await wrap(<ExamTeilScreen />);
    expect(await screen.findByText(/Recommended time per exercise: 15 min/)).toBeTruthy();
    expect(await screen.findByText(/Last time 10:00 of 15:00/)).toBeTruthy();
    expect(time.lastTimes).toHaveBeenCalledWith('LESEVERSTEHEN', 'B1');
  });

  it('lists average times per Teil in Zeitmanagement', async () => {
    mockParams = { level: 'B1' };
    time.timeManagement.mockResolvedValue([
      { section: 'LESEVERSTEHEN', teil: 1, sessions: 3, averageSeconds: 780, targetSeconds: 900, differenceSeconds: -120 },
      { section: 'SPRACHBAUSTEINE', teil: 2, sessions: 1, averageSeconds: 700, targetSeconds: null, differenceSeconds: null },
    ]);
    await wrap(<ZeitmanagementScreen />);
    expect(await screen.findByText('Lesen · Teil 1')).toBeTruthy();
    expect(screen.getByText('13:00')).toBeTruthy();
    expect(screen.getByText('\u200E-02:00')).toBeTruthy();
    expect(screen.getByText('✓ Within the target')).toBeTruthy();
    expect(screen.getByText('Sprachbausteine · Teil 2')).toBeTruthy();
  });

  it('explains an empty Zeitmanagement', async () => {
    mockParams = { level: 'B1' };
    time.timeManagement.mockResolvedValue([]);
    await wrap(<ZeitmanagementScreen />);
    expect(await screen.findByText('No times yet')).toBeTruthy();
  });
});

describe('local data on sign-out', () => {
  it('removes writing drafts and the running timer but keeps other keys', async () => {
    await AsyncStorage.setItem('writing-draft-x', '{}');
    await AsyncStorage.setItem('unrelated', '1');
    useExamTimerStore.setState({ active: { sessionId: 's' } as never, lastResult: { id: 'r' } as never });
    await act(async () => clearExamLocalData());
    expect(await AsyncStorage.getItem('writing-draft-x')).toBeNull();
    expect(await AsyncStorage.getItem('unrelated')).toBe('1');
    expect(useExamTimerStore.getState().active).toBeNull();
  });
});
