import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Alert } from 'react-native';
import { authApi } from '@/api/authApi';
import { dashboardApi } from '@/api/dashboardApi';
import { baseDashboard } from '@/features/dashboard/testing/fixtures';
import { tokenStorage } from '@/api/tokenStorage';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';

jest.mock('@/api/authApi');
jest.mock('@/api/dashboardApi');
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
    expect(await screen.findByText('Bald verfügbar')).toBeTruthy();
    expect(screen.getByText('Bald verfügbar')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Zurück' }));
    expect(await screen.findByText('Active Expressions')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: /Exam/ }));
    expect(await screen.findByText('Prüfungsvorbereitung')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Tutor/ }));
    expect(await screen.findByText('AI Tutor')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: /Profile/ }));
    expect(await screen.findByText('ali@example.com')).toBeTruthy();
    expect(screen.getByText('Niveau: B1')).toBeTruthy();
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
