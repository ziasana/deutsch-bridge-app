import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { grammarApi } from '@/api/grammarApi';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { CategoryTestScreen } from '../CategoryTestScreen';
import { makeCategory, notAttempted } from '../testing/fixtures';

jest.mock('@/api/grammarApi');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ categoryId: 'c1' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const category = grammarApi.category as jest.MockedFunction<typeof grammarApi.category>;
const submitTest = grammarApi.submitCategoryTest as jest.MockedFunction<
  typeof grammarApi.submitCategoryTest
>;
const markComplete = grammarApi.markCategoryComplete as jest.MockedFunction<
  typeof grammarApi.markCategoryComplete
>;

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
      <CategoryTestScreen />
    </QueryClientProvider>,
  );

/** Answers every question correctly ("bin" is the right option in all fixtures). */
async function playAll(total: number, pick = 'bin') {
  for (let i = 1; i <= total; i++) {
    await screen.findByText(`Question ${i} of ${total}`);
    await fireEvent.press(screen.getByRole('radio', { name: pick }));
    await fireEvent.press(screen.getByRole('button', { name: 'Check answer' }));
    await fireEvent.press(
      await screen.findByRole('button', {
        name: i === total ? 'See result' : 'Next question',
      }),
    );
  }
}

describe('CategoryTestScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useAuthStore.setState({ profile: { preferredLanguage: 'EN' } as UserProfile });
    category.mockResolvedValue(makeCategory());
  });

  it('pools only playable questions, scores on the device and submits the result', async () => {
    submitTest.mockResolvedValue({
      ...notAttempted,
      attempted: true,
      score: 3,
      total: 3,
      passed: true,
    });
    markComplete.mockResolvedValue({
      ...notAttempted,
      attempted: true,
      score: 3,
      total: 3,
      passed: true,
      completed: true,
    });
    await renderScreen();
    expect(await screen.findByText(/3 questions from the lessons/)).toBeTruthy(); // 2 + 1 playable (1 broken skipped)
    expect(screen.getByText(/at least 70%/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Start test' }));

    await playAll(3);
    expect(await screen.findByText('Passed!')).toBeTruthy();
    expect(submitTest).toHaveBeenCalledWith('c1', 3, 3);

    await fireEvent.press(await screen.findByRole('button', { name: 'Mark as completed' }));
    expect(await screen.findByText('✓ Category completed')).toBeTruthy();
  });

  it('reports a failed attempt encouragingly and offers a retake', async () => {
    submitTest.mockResolvedValue({
      ...notAttempted,
      attempted: true,
      score: 0,
      total: 3,
      passed: false,
    });
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Start test' }));
    await playAll(3, 'habe');
    expect(await screen.findByText('Well done!')).toBeTruthy();
    expect(screen.getByText('0 of 3 correct')).toBeTruthy();
    expect(await screen.findByText(/You need 70% to pass/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mark as completed' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Retake test' })).toBeTruthy();
  });

  it('lets the learner re-save the score when submitting fails', async () => {
    submitTest
      .mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'))
      .mockResolvedValueOnce({
        ...notAttempted,
        attempted: true,
        score: 3,
        total: 3,
        passed: true,
      });
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Start test' }));
    await playAll(3);
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Save result again' }));
    expect(await screen.findByText('Passed!')).toBeTruthy();
  });

  it('shows the last attempt and handles categories without questions', async () => {
    category.mockResolvedValue({
      ...makeCategory(),
      testStatus: { ...notAttempted, attempted: true, score: 8, total: 10, passed: true },
    });
    await renderScreen();
    expect(await screen.findByText('Last attempt: 8 of 10')).toBeTruthy();
    expect(screen.getByText('✓ Passed')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retake test' })).toBeTruthy();
  });

  it('shows an empty state when no question is playable', async () => {
    category.mockResolvedValue({ ...makeCategory(), lessons: [] });
    await renderScreen();
    expect(await screen.findByText('No exercises yet')).toBeTruthy();
  });
});
