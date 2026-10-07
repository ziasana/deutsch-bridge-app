import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { authApi } from '@/api/authApi';
import { ApiError } from '@/api/errors';
import { useAuthStore } from '@/stores/authStore';
import LoginScreen from '@/app/(auth)/login';

jest.mock('@/api/authApi');
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  router: { canGoBack: () => false, back: jest.fn() },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const login = authApi.login as jest.MockedFunction<typeof authApi.login>;

// Infinite gcTime avoids a lingering 5-minute cache timer that keeps Jest from exiting.
const testClient = new QueryClient({
  defaultOptions: { queries: { gcTime: Infinity }, mutations: { gcTime: Infinity } },
});

const renderScreen = () =>
  render(
    <QueryClientProvider client={testClient}>
      <LoginScreen />
    </QueryClientProvider>,
  );

describe('LoginScreen', () => {
  beforeEach(() => {
    login.mockReset();
    useAuthStore.setState({ status: 'unauthenticated', profile: null });
  });

  it('shows validation errors and does not call the API', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Please enter your email address.')).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
  });

  it('surfaces the server message for wrong credentials', async () => {
    login.mockRejectedValue(new ApiError('notFound', 'Incorrect email or password.', 404));
    await renderScreen();
    await fireEvent.changeText(screen.getByLabelText('Email'), 'a@b.de');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong');
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Incorrect email or password.')).toBeTruthy();
  });

  it('signs in on success', async () => {
    login.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      user: { displayName: 'Ali' } as never,
    });
    await renderScreen();
    await fireEvent.changeText(screen.getByLabelText('Email'), 'a@b.de');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'secret1');
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(useAuthStore.getState().status).toBe('authenticated'));
  });
});
