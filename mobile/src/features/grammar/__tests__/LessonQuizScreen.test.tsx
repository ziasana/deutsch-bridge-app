import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { exerciseProgressApi, grammarApi } from '@/api/grammarApi';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { LessonQuizScreen } from '../LessonQuizScreen';
import { fill, makeLesson, mcq, trueFalse } from '../testing/fixtures';

jest.mock('@/api/grammarApi');
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ lessonId: 'l1' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const lessonApi = grammarApi.lesson as jest.MockedFunction<typeof grammarApi.lesson>;
const setLearned = grammarApi.setLearned as jest.MockedFunction<typeof grammarApi.setLearned>;
const list = exerciseProgressApi.list as jest.MockedFunction<typeof exerciseProgressApi.list>;
const save = exerciseProgressApi.save as jest.MockedFunction<typeof exerciseProgressApi.save>;
const reset = exerciseProgressApi.reset as jest.MockedFunction<typeof exerciseProgressApi.reset>;

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
      <LessonQuizScreen />
    </QueryClientProvider>,
  );

const answerMcq = async (option: string) => {
  await fireEvent.press(screen.getByRole('radio', { name: option }));
  await fireEvent.press(screen.getByRole('button', { name: 'Antwort prüfen' }));
};

describe('LessonQuizScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useAuthStore.setState({ profile: { preferredLanguage: 'EN' } as UserProfile });
    lessonApi.mockResolvedValue(makeLesson({ quiz: [mcq(1), fill(), trueFalse()] }));
    list.mockResolvedValue([]);
    save.mockResolvedValue({});
    setLearned.mockResolvedValue({});
    reset.mockResolvedValue({});
  });

  it('runs all question types, saves each answer, marks the lesson learned on a perfect score', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Starten' }));

    // 1) multiple choice
    expect(await screen.findByText('Frage 1 von 3')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
    await answerMcq('bin');
    expect(await screen.findByText('✓ Richtig!')).toBeTruthy();
    expect(save).toHaveBeenCalledWith({ questionKey: 'l1:0', correct: true });
    await fireEvent.press(screen.getByRole('button', { name: 'Nächste Frage' }));

    // 2) fill-in (case-insensitive)
    await screen.findByText('Frage 2 von 3');
    await fireEvent.changeText(screen.getByLabelText('Deine Antwort'), 'BIST');
    await fireEvent.press(screen.getByRole('button', { name: 'Antwort prüfen' }));
    expect(await screen.findByText('✓ Richtig!')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Nächste Frage' }));

    // 3) true/false
    await screen.findByText('Frage 3 von 3');
    await fireEvent.press(screen.getByRole('radio', { name: 'Richtig' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Antwort prüfen' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Ergebnis ansehen' }));

    expect(await screen.findByText('Alle Fragen richtig – Lektion gelernt')).toBeTruthy();
    expect(screen.getByText('3 von 3 richtig')).toBeTruthy();
    expect(setLearned).toHaveBeenCalledWith('l1', true);
  });

  it('shows the correct answer after a wrong one and does not mark the lesson learned', async () => {
    lessonApi.mockResolvedValue(makeLesson({ quiz: [mcq(1)] }));
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Starten' }));
    await answerMcq('habe');
    expect(await screen.findByText('✕ Nicht richtig')).toBeTruthy();
    expect(screen.getByText('Richtig ist:')).toBeTruthy();
    expect(save).toHaveBeenCalledWith({ questionKey: 'l1:0', correct: false });
    await fireEvent.press(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(await screen.findByText('Übungen abgeschlossen')).toBeTruthy();
    expect(setLearned).not.toHaveBeenCalled();
  });

  it('resumes at the first unanswered question using saved progress', async () => {
    list.mockResolvedValue([{ questionKey: 'l1:0', correct: true }]);
    await renderScreen();
    expect(
      await screen.findByText(
        '1 von 3 bereits beantwortet. Du machst dort weiter, wo du aufgehört hast.',
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Fortsetzen' }));
    expect(await screen.findByText('Frage 2 von 3')).toBeTruthy();
  });

  it('opens straight on the results when everything was answered, and "Noch einmal" resets', async () => {
    list.mockResolvedValue([
      { questionKey: 'l1:0', correct: true },
      { questionKey: 'l1:1', correct: false },
      { questionKey: 'l1:2', correct: true },
      { questionKey: 'other:0', correct: true },
    ]);
    await renderScreen();
    expect(await screen.findByText('2 von 3 richtig')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Noch einmal üben' }));
    expect(reset).toHaveBeenCalledWith(['l1:0', 'l1:1', 'l1:2']);
    expect(await screen.findByText('Frage 1 von 3')).toBeTruthy();
  });

  it('skips unplayable questions and handles lessons with none', async () => {
    lessonApi.mockResolvedValue(
      makeLesson({
        quiz: [{ type: 'mcq', title: '', question: 'x', options: ['a'], answer: 'zz' }],
      }),
    );
    await renderScreen();
    expect(await screen.findByText('Keine Übungen')).toBeTruthy();
  });
});
