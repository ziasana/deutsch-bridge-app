import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { authApi } from '@/api/authApi';
import { dashboardApi } from '@/api/dashboardApi';
import { chatApi } from '@/api/chatApi';
import { examApi } from '@/api/examApi';
import { notificationApi } from '@/api/notificationApi';
import { progressApi } from '@/api/progressApi';
import { readingApi } from '@/api/readingApi';
import { baseDashboard } from '@/features/dashboard/testing/fixtures';
import { tokenStorage } from '@/api/tokenStorage';
import { markIntroPlayed } from '@/features/welcome/SplashIntro';
import { useAuthStore } from '@/stores/authStore';
import { slides } from '@/features/welcome/slides';
import type { UserProfile } from '@/types/user';

jest.mock('@/api/authApi');
jest.mock('@/api/dashboardApi');
jest.mock('@/api/progressApi');
jest.mock('@/api/readingApi');
jest.mock('@/api/examApi');
jest.mock('@/api/chatApi');
jest.mock('@/api/notificationApi');
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

const profile = {
  displayName: 'Ali',
  email: 'ali@example.com',
  learningLevel: 'B1',
  preferredLanguage: 'PR',
} as UserProfile;

describe('app navigation', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    (authApi.getProfile as jest.Mock).mockResolvedValue(profile);
    (dashboardApi.get as jest.Mock).mockResolvedValue(baseDashboard);
    const none = { learned: 0, total: 10 };
    (progressApi.stats as jest.Mock).mockResolvedValue({
      milestones: { wordsMastered: 0, thresholds: [10], reached: [false], nextThreshold: 10 },
      vocabulary: { newCount: 0, learning: 0, familiar: 0, mastered: 0, total: 0 },
      expressions: { newCount: 0, learning: 0, familiar: 0, mastered: 0, total: 0, active: 0 },
      grammar: {
        lessonsLearned: 0,
        lessonsTotal: 0,
        categoriesPassed: 0,
        categoriesAttempted: 0,
        categoriesTotal: 0,
      },
      reading: { learned: 0, total: 0 },
      examPerformance: { averageScore: null, attemptsCompleted: 0 },
    });
    (progressApi.overview as jest.Mock).mockResolvedValue({
      dailyGoalWords: 5,
      itemsLearnedToday: 2,
      dailyWords: none,
      grammar: none,
      expressions: none,
      reading: none,
      totalLearned: 0,
      totalAvailable: 40,
    });
    (readingApi.levelSummary as jest.Mock).mockResolvedValue([
      { level: 'B1', total: 0, learned: 0 },
    ]);
    (notificationApi.unreadCount as jest.Mock).mockResolvedValue({ count: 3 });
    (chatApi.sessions as jest.Mock).mockResolvedValue([]);
    (examApi.levelSummary as jest.Mock).mockResolvedValue([]);
    (examApi.pendingBookmarks as jest.Mock).mockResolvedValue([]);
    (readingApi.categories as jest.Mock).mockResolvedValue([]);
    (readingApi.page as jest.Mock).mockResolvedValue({
      items: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
    });
    useAuthStore.setState({ status: 'loading', profile: null, error: null });
    await tokenStorage.clear();
  });

  it('sends signed-out users to the welcome page once the intro has played', async () => {
    markIntroPlayed();
    await renderRouter('./src/app', { initialUrl: '/' });
    expect(await screen.findByText(slides[0].title)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Anmelden' }));
    expect(await screen.findByText('Mit Google anmelden')).toBeTruthy();
  });

  it('sends signed-in users without a learning plan to onboarding', async () => {
    await tokenStorage.setTokens('a', 'r');
    (authApi.getProfile as jest.Mock).mockResolvedValue({ ...profile, onboardingCompleted: false });
    await renderRouter('./src/app', { initialUrl: '/' });
    expect(await screen.findByText('Wie sollen wir Deutsch erklären?')).toBeTruthy();
  });

  it('walks every tab, pushes a feature screen, goes back, and logs out', async () => {
    await tokenStorage.setTokens('a', 'r');
    await renderRouter('./src/app', { initialUrl: '/' });

    expect(await screen.findByText('Perfekt')).toBeTruthy(); // dashboard loaded on Home

    await fireEvent.press(screen.getAllByRole('button', { name: /یادگیری/ }).at(-1)!);
    expect(await screen.findByText('محتوای یادگیری شما')).toBeTruthy();

    await fireEvent.press(screen.getByText('خواندن'));
    expect(await screen.findByText('متن‌هایی هم‌سطح خودتان بخوانید')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'بازگشت' }));
    expect(await screen.findByText('محتوای یادگیری شما')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: /آزمون/ }));
    expect(await screen.findByText('تمرین آزمون')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /مربی/ }));
    expect(await screen.findByText('مربی هوشمند')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: /پروفایل/ }));
    expect(await screen.findByText('ali@example.com')).toBeTruthy();
    expect(screen.getByText('سطح B1')).toBeTruthy();
    expect(await screen.findByText('3 جدید')).toBeTruthy(); // unread badge on the Notifications row
    expect(screen.getByText('PR')).toBeTruthy(); // explanation-language stat

    // Logout asks for confirmation, then the guard returns to the welcome page.
    await fireEvent.press(screen.getByRole('button', { name: 'خروج' }));
    expect(await screen.findByText('خروج از حساب؟')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'تأیید خروج' }));
    expect(await screen.findByText(slides[0].title)).toBeTruthy();
    expect(await tokenStorage.getRefresh()).toBeNull();
    await act(async () => {});
  });
});
