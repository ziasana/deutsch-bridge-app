import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { ApiError } from '@/api/errors';
import { userApi } from '@/api/userApi';
import { dictionaries } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { AccountScreen, passwordProblem } from '../AccountScreen';
import { SettingsScreen } from '../SettingsScreen';
import { initialsOf } from '../avatarPicker';

const T = dictionaries.en.account;

jest.mock('@/api/userApi');
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-image', () => ({ Image: () => null }));

const api = userApi as jest.Mocked<typeof userApi>;
const picker = ImagePicker.launchImageLibraryAsync as jest.Mock;

const profile = {
  displayName: 'Ali Reza',
  email: 'ali@example.com',
  learningLevel: 'B1',
  dailyGoalWords: 10,
  preferredLanguage: 'EN',
  role: 'USER',
  avatarUrl: null,
  createdAt: '2026-03-15T10:00:00Z',
  onboardingCompleted: true,
} as UserProfile;

let queryClient: QueryClient;
const wrap = (ui: React.ReactElement) => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ profile });
});

describe('helpers', () => {
  it('validates the password form', () => {
    expect(passwordProblem('', 'abcdef', 'abcdef', T)).toMatch(/current password/);
    expect(passwordProblem('old', 'abc', 'abc', T)).toMatch(/at least 6/);
    expect(passwordProblem('old', 'abcdef', 'abcdeg', T)).toMatch(/do not match/);
    expect(passwordProblem('abcdef', 'abcdef', 'abcdef', T)).toMatch(/must differ/);
    expect(passwordProblem('old', 'abcdef', 'abcdef', T)).toBeNull();
  });
  it('builds initials', () => {
    expect(initialsOf('Ali Reza Khan', 'x@y.z')).toBe('AR');
    expect(initialsOf(null, 'zed@y.z')).toBe('Z');
    expect(initialsOf(null, null)).toBe('?');
  });
});

describe('SettingsScreen', () => {
  it('shows the current choices and saves only what changed, merging into the session profile', async () => {
    api.updateProfile.mockResolvedValue({ message: 'ok', data: null });
    await wrap(<SettingsScreen />);
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
    expect(screen.getByRole('button', { name: 'B1' }).props.accessibilityState.selected).toBe(true);

    await fireEvent.press(screen.getByRole('button', { name: 'B2' }));
    await fireEvent.press(screen.getByRole('button', { name: '🇮🇷 فارسی' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(api.updateProfile).toHaveBeenCalledWith({
        learningLevel: 'B2',
        preferredLanguage: 'PR',
      }),
    );
    await waitFor(() =>
      expect(useAuthStore.getState().profile).toMatchObject({
        learningLevel: 'B2',
        preferredLanguage: 'PR',
        displayName: 'Ali Reza',
        onboardingCompleted: true,
        role: 'USER',
      }),
    );
    expect(await screen.findByText('✓ Saved')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
  });

  it('can discard edits and shows save errors', async () => {
    api.updateProfile.mockRejectedValue(
      new ApiError('server', 'Der Server ist gerade nicht erreichbar.'),
    );
    await wrap(<SettingsScreen />);
    await fireEvent.press(screen.getByRole('button', { name: '20 words' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.queryByRole('button', { name: 'Discard' })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: '5 words' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Der Server ist gerade nicht erreichbar.')).toBeTruthy();
    expect(useAuthStore.getState().profile?.dailyGoalWords).toBe(10); // unchanged on failure
  });
});

describe('AccountScreen', () => {
  it('shows account info and saves a changed name', async () => {
    api.updateProfile.mockResolvedValue({ message: 'ok', data: null });
    await wrap(<AccountScreen />);
    expect(screen.getByLabelText('Email').props.editable).toBe(false);
    expect(screen.getByText(/Member since .*2026/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save name' })).toBeNull();

    await fireEvent.changeText(screen.getByLabelText('Name'), '  Ali R.  ');
    await fireEvent.press(screen.getByRole('button', { name: 'Save name' }));
    await waitFor(() => expect(api.updateProfile).toHaveBeenCalledWith({ displayName: 'Ali R.' }));
    await waitFor(() => expect(useAuthStore.getState().profile?.displayName).toBe('Ali R.'));
  });

  it('uploads a picked photo and updates the profile picture', async () => {
    picker.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///p.png', mimeType: 'image/png', fileName: null }],
    });
    api.uploadAvatar.mockResolvedValue('/uploads/avatars/me.png');
    await wrap(<AccountScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Change photo' }));
    await waitFor(() =>
      expect(api.uploadAvatar).toHaveBeenCalledWith({
        uri: 'file:///p.png',
        name: 'avatar.png',
        type: 'image/png',
      }),
    );
    expect(picker).toHaveBeenCalledWith(
      expect.objectContaining({ allowsEditing: true, aspect: [1, 1], mediaTypes: ['images'] }),
    );
    await waitFor(() =>
      expect(useAuthStore.getState().profile?.avatarUrl).toBe('/uploads/avatars/me.png'),
    );
    expect(await screen.findByText('✓ Profile photo updated')).toBeTruthy();
  });

  it('does nothing when the picker is cancelled and rejects unsupported formats', async () => {
    await wrap(<AccountScreen />);
    picker.mockResolvedValueOnce({ canceled: true, assets: [] });
    await fireEvent.press(screen.getByRole('button', { name: 'Change photo' }));
    expect(api.uploadAvatar).not.toHaveBeenCalled();

    picker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///a.gif', mimeType: 'image/gif' }],
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Change photo' }));
    expect(await screen.findByText('Bitte wähle ein JPG-, PNG- oder WebP-Bild.')).toBeTruthy();
    expect(api.uploadAvatar).not.toHaveBeenCalled();
  });

  it('changes the password after validating, and clears the fields', async () => {
    api.updatePassword.mockResolvedValue({ message: 'ok', data: null });
    await wrap(<AccountScreen />);
    await fireEvent.changeText(screen.getByLabelText('Current password'), 'oldpass');
    await fireEvent.changeText(screen.getByLabelText('New password'), 'newpass1');
    await fireEvent.changeText(screen.getByLabelText('Repeat new password'), 'different');
    await fireEvent.press(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('The new passwords do not match.')).toBeTruthy();
    expect(api.updatePassword).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Repeat new password'), 'newpass1');
    await fireEvent.press(screen.getByRole('button', { name: 'Change password' }));
    await waitFor(() => expect(api.updatePassword).toHaveBeenCalledWith('oldpass', 'newpass1'));
    expect(await screen.findByText('✓ Password changed')).toBeTruthy();
    expect(screen.getByLabelText('Current password').props.value).toBe('');
  });

  it('shows the server message for a wrong current password', async () => {
    api.updatePassword.mockRejectedValue(
      new ApiError('validation', 'Das aktuelle Passwort ist falsch.', 400),
    );
    await wrap(<AccountScreen />);
    await fireEvent.changeText(screen.getByLabelText('Current password'), 'wrong');
    await fireEvent.changeText(screen.getByLabelText('New password'), 'newpass1');
    await fireEvent.changeText(screen.getByLabelText('Repeat new password'), 'newpass1');
    await fireEvent.press(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('Das aktuelle Passwort ist falsch.')).toBeTruthy();
  });
});
