import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Alert } from 'react-native';
import { authApi } from '@/api/authApi';
import { dashboardApi } from '@/api/dashboardApi';
import { chatApi } from '@/api/chatApi';
import { examApi } from '@/api/examApi';
import { notificationApi } from '@/api/notificationApi';
import { readingApi } from '@/api/readingApi';
import { baseDashboard } from '@/features/dashboard/testing/fixtures';
import { tokenStorage } from '@/api/tokenStorage';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';

jest.mock('@/api/authApi');
jest.mock('@/api/dashboardApi');
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
    (readingApi.levelSummary as jest.Mock).mockResolvedValue([{ level: 'B1', total: 0, learned: 0 }]);
    (notificationApi.unreadCount as jest.Mock).mockResolvedValue({ count: 3 });
    (chatApi.sessions as jest.Mock).mockResolvedValue([]);
    (examApi.levelSummary as jest.Mock).mockResolvedValue([]);
    (examApi.pendingBookmarks as jest.Mock).mockResolvedValue([]);
    (readingApi.categories as jest.Mock).mockResolvedValue([]);
    (readingApi.page as jest.Mock).mockResolvedValue({ items: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
    useAuthStore.setState({ status: 'loading', profile: null, error: null });
    await tokenStorage.clear();
  });

  it('sends signed-out users to login', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });
    expect(await screen.findByText('Willkommen zurück 👋')).toBeTruthy();
  });

  it('walks every tab, pushes a feature screen, goes back, and logs out', async () => {
    await tokenStorage.setTokens('a', 'r');
    await renderRouter('./src/app', { initialUrl: '/' });

    expect(await screen.findByText('Perfekt')).toBeTruthy(); // dashboard loaded on Home

    await fireEvent.press(screen.getByRole('button', { name: /Learn/ }));
    expect(await screen.findByText('Active Expressions')).toBeTruthy();

    await fireEvent.press(screen.getByText('Reading'));
    expect(await screen.findByText('Lies Texte auf deinem Niveau')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Zurück' }));
    expect(await screen.findByText('Active Expressions')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: /Exam/ }));
    expect(await screen.findByText('Prüfungsvorbereitung')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Tutor/ }));
    expect(await screen.findByText('AI Tutor')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: /Profile/ }));
    expect(await screen.findByText('ali@example.com')).toBeTruthy();
    expect(screen.getByText('Niveau: B1')).toBeTruthy();
    expect(await screen.findByText('3 ungelesen')).toBeTruthy(); // unread badge on the Notifications row
    expect(screen.getByText('Erklärsprache: Persian')).toBeTruthy();

    // Logout asks for confirmation, then the guard returns to login.
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Abmelden' }));
    expect(alert).toHaveBeenCalled();
    expect(await screen.findByText('Willkommen zurück 👋')).toBeTruthy();
    expect(await tokenStorage.getRefresh()).toBeNull();
    await act(async () => {});
  });
});
