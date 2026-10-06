import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { authApi } from '@/api/authApi';
import { passwordStrength } from '@/features/auth/passwordStrength';
import { RegisterWizard } from '../RegisterWizard';

jest.mock('@/api/authApi');
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  router: { back: jest.fn(), push: jest.fn() },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const register = authApi.register as jest.MockedFunction<typeof authApi.register>;

const wrap = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { gcTime: Infinity } } })}
    >
      <RegisterWizard />
    </QueryClientProvider>,
  );

describe('RegisterWizard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('walks intro → name → e-mail → password and registers', async () => {
    register.mockRejectedValue(new Error('stop')); // we only assert the call
    await wrap();
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));

    await fireEvent.changeText(screen.getByLabelText('Name'), 'Al');
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));
    expect(await screen.findByText('Der Name muss mindestens 3 Zeichen lang sein.')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Name'), 'Ali');
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));

    await fireEvent.changeText(screen.getByLabelText('E-Mail'), 'nope');
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));
    expect(await screen.findByText('Bitte gib eine gültige E-Mail-Adresse ein.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('E-Mail'), 'ali@example.com');
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));

    await fireEvent.changeText(screen.getByLabelText('Passwort'), 'Sup3r-secret!');
    expect(screen.getByText('Passwortstärke: Sehr stark')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Starten' }));
    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        displayName: 'Ali',
        email: 'ali@example.com',
        password: 'Sup3r-secret!',
      }),
    );
  });
});

describe('passwordStrength', () => {
  it('scales with length and variety', () => {
    expect(passwordStrength('abc').label).toBe('Zu kurz');
    expect(passwordStrength('abcdef').score).toBeLessThanOrEqual(1);
    expect(passwordStrength('Abcdef12').score).toBeGreaterThanOrEqual(2);
    expect(passwordStrength('Sup3r-secret!').score).toBe(4);
  });
});
