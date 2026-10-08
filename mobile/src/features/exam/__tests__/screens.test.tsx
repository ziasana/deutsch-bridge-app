import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { AppState } from 'react-native';
import { ApiError } from '@/api/errors';
import { examApi, examAttemptApi } from '@/api/examApi';
import { examTimeApi } from '@/api/examTimeApi';
import { useExamTimerStore } from '../time/timerStore';
import { useExamTextSize } from '../textScale';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { ExamExerciseScreen } from '../ExamExerciseScreen';
import { ExamHubScreen } from '../ExamHubScreen';
import { ExamTeilScreen } from '../ExamTeilScreen';
import { exercise, passage, question, summary } from '../testing/fixtures';

jest.mock('@/api/examApi');
jest.mock('@/api/examTimeApi');
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockParams,
  useFocusEffect: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-image', () => ({ Image: () => null }));
const mockPlayer = { play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() };
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => mockPlayer,
  useAudioPlayerStatus: () => ({ playing: false, currentTime: 0, duration: 65, isLoaded: true }),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

const api = examApi as jest.Mocked<typeof examApi>;
const attempts = examAttemptApi as jest.Mocked<typeof examAttemptApi>;
const time = examTimeApi as jest.Mocked<typeof examTimeApi>;

const SESSION = {
  id: 'ps1',
  scope: 'EXERCISE' as const,
  mode: 'TIME_TRAINING' as const,
  section: 'LESEVERSTEHEN' as const,
  level: 'B1',
  teil: 2,
  exerciseId: 'e1',
  startedAt: '2026-01-01T00:00:00Z',
  targetSeconds: 600,
};

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
  (setAudioModeAsync as jest.Mock).mockResolvedValue(undefined);
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() } as never);
  time.configurations.mockResolvedValue([]);
  time.lastTimes.mockResolvedValue([]);
  time.startSession.mockResolvedValue(SESSION);
  useExamTimerStore.setState({ active: null, lastResult: null, hasHydrated: true });
  useAuthStore.setState({
    profile: { learningLevel: 'B1', preferredLanguage: 'EN' } as UserProfile,
  });
});

const LEVELS = [
  { level: 'A2', total: 2, mastered: 0, avgScore: 0 },
  { level: 'B1', total: 5, mastered: 1, avgScore: 20 },
];

describe('ExamHubScreen', () => {
  const list = [
    summary('a', { partNumber: 1, lastScore: 100, completed: true }),
    summary('b', { partNumber: 1 }),
    summary('c', { partNumber: 2, taskType: 'MULTIPLE_CHOICE', title: 'Einzel' }),
    summary('w', {
      section: 'SCHRIFTLICHER_AUSDRUCK',
      taskType: 'WRITING_TASK',
      title: 'E-Mail an den Vermieter',
      teil: 1,
    }),
    summary('i', {
      section: 'TESTFORMAT_INFORMATION',
      taskType: null,
      title: 'Aufbau',
      teilDescription: 'So läuft die Prüfung',
    }),
  ];

  beforeEach(() => {
    api.levelSummary.mockResolvedValue(LEVELS);
    api.exercisesForLevel.mockResolvedValue(list);
    api.pendingBookmarks.mockResolvedValue([]);
  });

  it('opens on the profile level with Teile and a continue card', async () => {
    await wrap(<ExamHubScreen />);
    expect(await screen.findByRole('button', { name: /^Part 1 – Matching tasks/ })).toBeTruthy();
    expect(api.exercisesForLevel).toHaveBeenCalledWith('B1');
    expect(screen.getByRole('button', { name: 'B1 · 1/5' }).props.accessibilityState.selected).toBe(
      true,
    );

    // Teil 2 has a single exercise: opens it directly. Teil 1 has two: opens the Teil list.
    await fireEvent.press(screen.getByRole('button', { name: /^Part 2/ }));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/exam-prep/exercise/[exerciseId]',
      params: { exerciseId: 'c' },
    });
    await fireEvent.press(screen.getByRole('button', { name: /^Part 1/ }));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/exam-prep/teil',
      params: { section: 'LESEVERSTEHEN', level: 'B1', part: '1' },
    });
  });

  it('continues with the next unmastered exercise', async () => {
    await wrap(<ExamHubScreen />);
    await screen.findByText('Keep learning · Reading');
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/exam-prep/exercise/[exerciseId]',
      params: { exerciseId: 'b' },
    });
  });

  it('lists Testformat info and the Schreiben tasks directly', async () => {
    await wrap(<ExamHubScreen />);
    await screen.findByText('Keep learning · Reading');
    await fireEvent.press(screen.getByRole('button', { name: /Test format/ }));
    expect(await screen.findByText('So läuft die Prüfung')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Writing/ }));
    expect(await screen.findByText('E-Mail an den Vermieter')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /E-Mail an den Vermieter/ }));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/exam-prep/exercise/[exerciseId]',
      params: { exerciseId: 'w' },
    });
    await fireEvent.press(screen.getByRole('button', { name: '⏱ My time management' }));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/exam-prep/zeitmanagement',
      params: { level: 'B1' },
    });
  });

  it('reloads when the level changes and filters by search', async () => {
    await wrap(<ExamHubScreen />);
    await screen.findByText('Keep learning · Reading');
    await fireEvent.press(screen.getByRole('button', { name: 'A2 · 0/2' }));
    await waitFor(() => expect(api.exercisesForLevel).toHaveBeenCalledWith('A2'));
    await fireEvent.changeText(screen.getByLabelText('Search for an exam part or task'), 'zzz');
    expect(await screen.findByText('Nothing found')).toBeTruthy();
  });

  it('shows saved-for-later bookmarks and can remove one', async () => {
    api.pendingBookmarks.mockResolvedValue([
      {
        id: 's1',
        title: '3. Übung',
        section: 'HOERVERSTEHEN',
        level: 'B1',
        bookmarkedAt: '2026-01-01T00:00:00Z',
      },
    ]);
    api.removeBookmark.mockResolvedValue(summary('s1'));
    await wrap(<ExamHubScreen />);
    expect(await screen.findByText('Listening: Exercise 3')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Remove bookmark' }));
    await waitFor(() => expect(api.removeBookmark).toHaveBeenCalledWith('s1'));
  });

  it('shows an error state', async () => {
    api.levelSummary.mockRejectedValue(new ApiError('network', 'Keine Verbindung.'));
    api.exercisesForLevel.mockRejectedValue(new ApiError('network', 'Keine Verbindung.'));
    await wrap(<ExamHubScreen />);
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
  });
});

describe('ExamTeilScreen', () => {
  beforeEach(() => {
    mockParams = { section: 'LESEVERSTEHEN', level: 'B1', part: '1' };
    api.exercisesForLevel.mockResolvedValue([
      summary('a', { title: '1. Übung', lastScore: 100, completed: true }),
      summary('b', { title: '2. Übung' }),
    ]);
  });

  it('lists exercises, filters by status, bookmarks and opens one', async () => {
    api.addBookmark.mockResolvedValue(summary('b', { bookmarked: true }));
    await wrap(<ExamTeilScreen />);
    expect(await screen.findByText('Exercise 2')).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Open' }));
    expect(screen.queryByText('1. Übung')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Completed' }));
    expect(screen.queryByText('2. Übung')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'All' }));

    await fireEvent.press(screen.getAllByRole('button', { name: 'Save task' })[1]);
    await waitFor(() => expect(api.addBookmark).toHaveBeenCalledWith('b'));

    await fireEvent.press(screen.getByRole('button', { name: 'Continue: Exercise 2' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/exam-prep/exercise/[exerciseId]',
      params: { exerciseId: 'b' },
    });
  });

  it('shows not-found for an unknown part', async () => {
    mockParams = { section: 'LESEVERSTEHEN', level: 'B1', part: '9' };
    await wrap(<ExamTeilScreen />);
    expect(await screen.findByText('Not found')).toBeTruthy();
  });
});

describe('ExamExerciseScreen', () => {
  beforeEach(() => {
    mockParams = { exerciseId: 'e1' };
    api.markCompleted.mockResolvedValue(undefined);
    api.exercisesForLevel.mockResolvedValue([]);
  });

  it('runs a step quiz with feedback, results and mark-completed', async () => {
    api.byId.mockResolvedValue(exercise({ defaultExplanation: 'Lies genau.' }));
    attempts.start.mockResolvedValue({
      attemptId: 'at1',
      passages: [passage('p1')],
      questions: [question('q1'), question('q2', { questionNumber: 7 })],
      answerOptions: null,
      answerOptionLabels: null,
    });
    attempts.answer
      .mockResolvedValueOnce({
        correct: false,
        correctAnswer: 'Ja',
        explanation: 'Steht im Text.',
        commonMistake: '',
        transcript: null,
      })
      .mockResolvedValueOnce({
        correct: true,
        correctAnswer: 'Nein',
        explanation: '',
        commonMistake: '',
        transcript: null,
      });
    attempts.complete.mockResolvedValue({ attemptId: 'at1', score: 50, transcripts: [] });
    await wrap(<ExamExerciseScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Start exercise' }));
    expect(await screen.findByText('Aufgabe 1 von 2')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('radio', { name: 'Nein' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Antwort prüfen' }));
    expect(await screen.findByText('✕ Falsch')).toBeTruthy();
    expect(screen.getByText('Steht im Text.', { exact: false })).toBeTruthy();
    expect(attempts.answer).toHaveBeenCalledWith('at1', 'q1', 'Nein');

    await fireEvent.press(screen.getByRole('button', { name: 'Nächste Aufgabe' }));
    expect(await screen.findByText('Aufgabe 7 (2 von 2)')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Nein' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Antwort prüfen' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Ergebnis anzeigen' }));

    expect(await screen.findByText('Gut gemacht!')).toBeTruthy();
    expect(screen.getByText('1 von 2 Aufgaben richtig')).toBeTruthy();
    expect(screen.getByText('💡 Lies genau.')).toBeTruthy();
    await waitFor(() => expect(api.markCompleted).toHaveBeenCalledWith('e1'));

    await fireEvent.press(screen.getByRole('button', { name: 'Erneut üben' }));
    expect(await screen.findByRole('button', { name: 'Start exercise' })).toBeTruthy();
  });

  it('offers the next open exercise of the Teil and lets the learner review only mistakes', async () => {
    api.byId.mockResolvedValue(exercise());
    api.exercisesForLevel.mockResolvedValue([
      summary('e1', { taskType: 'MULTIPLE_CHOICE', partNumber: 2, title: '1. Übung' }),
      summary('e2', { taskType: 'MULTIPLE_CHOICE', partNumber: 2, title: '2. Übung' }),
    ]);
    attempts.start.mockResolvedValue({
      attemptId: 'at9',
      passages: [passage('p1')],
      questions: [question('q1'), question('q2')],
      answerOptions: null,
      answerOptionLabels: null,
    });
    attempts.answer
      .mockResolvedValueOnce({
        correct: false,
        correctAnswer: 'Ja',
        explanation: 'Falsch gelesen.',
        commonMistake: '',
        transcript: null,
      })
      .mockResolvedValueOnce({
        correct: true,
        correctAnswer: 'Nein',
        explanation: 'Gut erkannt.',
        commonMistake: '',
        transcript: null,
      });
    attempts.complete.mockResolvedValue({ attemptId: 'at9', score: 50, transcripts: [] });
    await wrap(<ExamExerciseScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Start exercise' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Nein' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Antwort prüfen' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Nächste Aufgabe' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Nein' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Antwort prüfen' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Ergebnis anzeigen' }));

    // The mistake starts open, the correct answer folded away.
    expect(await screen.findByText('💡 Falsch gelesen.')).toBeTruthy();
    expect(screen.queryByText('💡 Gut erkannt.')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Fehler (1)' }));
    expect(screen.queryByRole('button', { name: /Aufgabe 2.*richtig/ })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Nächste Übung' }));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/exam-prep/exercise/[exerciseId]',
      params: { exerciseId: 'e2' },
    });
  });

  it('answers a word-bank cloze all at once and shows ad labels for situation matching', async () => {
    api.byId.mockResolvedValue(
      exercise({
        taskType: 'SITUATION_MATCHING',
        passages: [passage('ad1', { label: 'a' }), passage('ad2', { label: 'b' })],
        questions: [],
      }),
    );
    attempts.start.mockResolvedValue({
      attemptId: 'at2',
      passages: [passage('ad1', { label: 'a' }), passage('ad2', { label: 'b' })],
      questions: [
        question('s1', { taskType: 'SITUATION_MATCHING', prompt: 'Situation 1', options: null }),
        question('s2', { taskType: 'SITUATION_MATCHING', prompt: 'Situation 2', options: null }),
      ],
      answerOptions: null,
      answerOptionLabels: null,
    });
    attempts.answer
      .mockResolvedValueOnce({
        correct: true,
        correctAnswer: 'ad1',
        explanation: '',
        commonMistake: '',
        transcript: null,
      })
      .mockResolvedValueOnce({
        correct: false,
        correctAnswer: 'ad2',
        explanation: '',
        commonMistake: '',
        transcript: null,
      });
    attempts.complete.mockResolvedValue({ attemptId: 'at2', score: 50, transcripts: [] });
    await wrap(<ExamExerciseScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Start exercise' }));
    expect(screen.getByRole('button', { name: 'Antworten abgeben' })).toBeDisabled();

    await fireEvent.press(await screen.findByRole('radio', { name: 'Aufgabe 1: a' }));
    // Ad "a" is already used by situation 1, so it is unavailable for situation 2.
    expect(screen.getByRole('radio', { name: 'Aufgabe 2: a' })).toBeDisabled();
    expect(screen.getByText('1 von 2 beantwortet')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Aufgabe 2: x (keine Anzeige)' }));
    expect(screen.getByText('✓ Alles beantwortet – bereit zum Abgeben')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Antworten abgeben' }));

    expect(await screen.findByText('Gut gemacht!')).toBeTruthy(); // 1 of 2 right → 50%
    expect(attempts.answer).toHaveBeenNthCalledWith(1, 'at2', 's1', 'ad1');
    expect(attempts.answer).toHaveBeenNthCalledWith(2, 'at2', 's2', 'X');
    // The wrong answer's correct ad id is shown as its label.
    expect(screen.getByText(/Richtige Antwort/)).toHaveTextContent('Richtige Antwort: b');
  });

  it('runs Hörverstehen with audio, +/- answers and a transcript at the end', async () => {
    api.byId.mockResolvedValue(
      exercise({
        section: 'HOERVERSTEHEN',
        taskType: 'TRUE_FALSE_NOT_GIVEN',
        passages: [passage('c1', { audioUrl: '/uploads/a.mp3' })],
      }),
    );
    attempts.start.mockResolvedValue({
      attemptId: 'at3',
      passages: [passage('c1', { label: 'Text 1', audioUrl: '/uploads/a.mp3' })],
      questions: [question('h1', { prompt: 'Der Zug fährt ab.', options: null, sectionIndex: 0 })],
      answerOptions: ['+', '-'],
      answerOptionLabels: null,
    });
    attempts.answer.mockResolvedValue({
      correct: true,
      correctAnswer: '+',
      explanation: '',
      commonMistake: '',
      transcript: null,
    });
    attempts.complete.mockResolvedValue({
      attemptId: 'at3',
      score: 100,
      transcripts: [{ label: 'Text 1', transcript: 'Der Zug fährt ab.' }],
    });
    await wrap(<ExamExerciseScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Start exercise' }));
    expect(await screen.findByText('0:00 / 1:05')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Audio Text 1: Abspielen' }));
    expect(mockPlayer.play).toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('radio', { name: 'Aufgabe 1: +' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Antworten abgeben' }));
    expect(await screen.findByText('Sehr gut!')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Transkript anzeigen' })).toBeTruthy();
  });

  it('keeps the answers and offers a retry when submitting fails', async () => {
    api.byId.mockResolvedValue(
      exercise({ section: 'HOERVERSTEHEN', taskType: 'TRUE_FALSE_NOT_GIVEN', passages: [] }),
    );
    attempts.start.mockResolvedValue({
      attemptId: 'at4',
      passages: [],
      questions: [question('h1', { options: null })],
      answerOptions: ['+', '-'],
      answerOptionLabels: null,
    });
    attempts.answer.mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'));
    await wrap(<ExamExerciseScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Start exercise' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Aufgabe 1: -' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Antworten abgeben' }));
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Erneut abgeben' })).toBeTruthy();
  });

  it('marks Testformat information as done', async () => {
    api.byId.mockResolvedValue(
      exercise({ section: 'TESTFORMAT_INFORMATION', taskType: null, questions: [] }),
    );
    await wrap(<ExamExerciseScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Als erledigt markieren' }));
    await waitFor(() => expect(api.markCompleted).toHaveBeenCalledWith('e1'));
    expect(await screen.findByRole('button', { name: 'Als erledigt markiert ✓' })).toBeTruthy();
  });

  it('toggles the bookmark on the exercise screen', async () => {
    api.byId.mockResolvedValue(
      exercise({ section: 'TESTFORMAT_INFORMATION', taskType: null, questions: [] }),
    );
    api.addBookmark.mockResolvedValue(summary('e1', { bookmarked: true }));
    await wrap(<ExamExerciseScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Aufgabe merken' }));
    await waitFor(() => expect(api.addBookmark).toHaveBeenCalledWith('e1'));
    expect(await screen.findByRole('button', { name: 'Merkzeichen entfernen' })).toBeTruthy();
  });

  it('times a Lesen exercise and shows the Zeit-Check with the result', async () => {
    api.byId.mockResolvedValue(exercise());
    time.completeSession.mockResolvedValue({
      id: 'ps1',
      scope: 'EXERCISE',
      mode: 'TIME_TRAINING',
      section: 'LESEVERSTEHEN',
      level: 'B1',
      teil: 2,
      elapsedSeconds: 432,
      targetSeconds: 600,
      differenceSeconds: -168,
      questionsTotal: 1,
      questionsAnswered: 1,
      correctAnswers: 1,
      score: 100,
    });
    attempts.start.mockResolvedValue({
      attemptId: 'at9',
      passages: [passage('p1')],
      questions: [question('q1')],
      answerOptions: null,
      answerOptionLabels: null,
    });
    attempts.answer.mockResolvedValue({
      correct: true,
      correctAnswer: 'Ja',
      explanation: '',
      commonMistake: '',
      transcript: null,
    });
    attempts.complete.mockResolvedValue({ attemptId: 'at9', score: 100, transcripts: [] });
    await wrap(<ExamExerciseScreen />);

    // Opening the exercise does not start the clock; it waits for "Start exercise".
    await screen.findByRole('button', { name: 'Start exercise' });
    expect(screen.queryByText('Time for this exercise')).toBeNull();
    expect(screen.getByText(/The timer starts with/)).toBeTruthy();
    expect(time.startSession).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Start exercise' }));
    expect(await screen.findByText('Time for this exercise')).toBeTruthy();
    expect(time.startSession).toHaveBeenCalledWith({
      scope: 'EXERCISE',
      mode: 'TIME_TRAINING',
      exerciseId: 'e1',
    });
    expect(screen.getByLabelText(/Elapsed time 00:00/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Pause timer' }));
    expect(await screen.findByText('Paused')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Resume timer' }));

    await fireEvent.press(await screen.findByRole('radio', { name: 'Ja' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Antwort prüfen' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Ergebnis anzeigen' }));

    expect(await screen.findByText('07:12')).toBeTruthy();
    expect(screen.getByText('✓ 2:48 under the target')).toBeTruthy();
    expect(time.completeSession).toHaveBeenCalledWith('ps1', expect.any(Number));
    expect(useExamTimerStore.getState().active).toBeNull();
    expect(useExamTimerStore.getState().lastResult?.elapsedSeconds).toBe(432);
  });

  it('lets the learner change the text size, and remembers it', async () => {
    api.byId.mockResolvedValue(exercise());
    useExamTextSize.setState({ index: 1 });
    await wrap(<ExamExerciseScreen />);
    await screen.findByRole('button', { name: 'Start exercise' });

    await fireEvent.press(screen.getByRole('button', { name: 'Larger text' }));
    expect(useExamTextSize.getState().index).toBe(2);
    await fireEvent.press(screen.getByRole('button', { name: 'Larger text' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Larger text' }));
    expect(useExamTextSize.getState().index).toBe(3);
    expect(screen.getByRole('button', { name: 'Larger text' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Smaller text' }));
    expect(useExamTextSize.getState().index).toBe(2);
  });

  it('shows reading time, lets the learner mark paragraphs and read the text aloud', async () => {
    api.byId.mockResolvedValue(exercise());
    attempts.start.mockResolvedValue({
      attemptId: 'at7',
      passages: [passage('p1', { content: 'Erster Absatz.\n\nZweiter Absatz.' })],
      questions: [question('q1')],
      answerOptions: null,
      answerOptionLabels: null,
    });
    await wrap(<ExamExerciseScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Start exercise' }));

    expect(await screen.findByText(/4 Wörter · ca\. 1 Min\. Lesezeit/)).toBeTruthy();
    const paragraphs = screen.getAllByRole('button', { name: 'Absatz markieren' });
    expect(paragraphs).toHaveLength(2);
    await fireEvent.press(paragraphs[0]);
    expect(screen.getAllByRole('button', { name: 'Markierung entfernen' })).toHaveLength(1);

    await fireEvent.press(screen.getByRole('button', { name: 'Text vorlesen' }));
    // Read paragraph by paragraph in German.
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(
        'Erster Absatz.',
        expect.objectContaining({ language: 'de-DE' }),
      ),
    );
    expect(screen.getByRole('button', { name: 'Vorlesen stoppen' })).toBeTruthy();
  });

  it('does not time Hörverstehen', async () => {
    api.byId.mockResolvedValue(
      exercise({ section: 'HOERVERSTEHEN', taskType: 'TRUE_FALSE_NOT_GIVEN', passages: [] }),
    );
    await wrap(<ExamExerciseScreen />);
    await screen.findByRole('button', { name: 'Start exercise' });
    expect(time.startSession).not.toHaveBeenCalled();
    expect(screen.queryByText('Time for this exercise')).toBeNull();
  });

  it('shows an error state when the exercise fails to load', async () => {
    api.byId.mockRejectedValue(new ApiError('network', 'Keine Verbindung.'));
    await wrap(<ExamExerciseScreen />);
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
  });
});
