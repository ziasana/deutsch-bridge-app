import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';
import { notificationApi } from '@/api/notificationApi';
import { inAppHref } from '../destination';
import { PushCard } from '../PushCard';
import {
  enablePush,
  getPushState,
  parsePushData,
  syncPushRegistration,
  unregisterPush,
} from '../push';
import { usePushNotifications } from '../usePushNotifications';

jest.mock('@/api/notificationApi');
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'proj-1' } } } },
}));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getLastNotificationResponse: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const api = notificationApi as jest.Mocked<typeof notificationApi>;
const n = Notifications as jest.Mocked<typeof Notifications>;

const granted = {
  status: 'granted',
  canAskAgain: true,
} as Notifications.NotificationPermissionsStatus;
const undetermined = {
  status: 'undetermined',
  canAskAgain: true,
} as Notifications.NotificationPermissionsStatus;
const denied = {
  status: 'denied',
  canAskAgain: false,
} as Notifications.NotificationPermissionsStatus;

beforeEach(async () => {
  jest.clearAllMocks();
  Object.values(api).forEach((fn) => (fn as jest.Mock).mockReset());
  api.registerDevice.mockResolvedValue(undefined);
  api.unregisterDevice.mockResolvedValue(undefined);
  n.getExpoPushTokenAsync.mockResolvedValue({ type: 'expo', data: 'ExponentPushToken[abc]' });
  await AsyncStorage.clear();
});

describe('parsePushData / inAppHref', () => {
  it('keeps only the expected string fields', () => {
    expect(parsePushData({ notificationId: 'n1', actionUrl: '/dashboard/grammar', x: 1 })).toEqual({
      notificationId: 'n1',
      actionUrl: '/dashboard/grammar',
    });
    expect(parsePushData({ notificationId: 5 })).toEqual({
      notificationId: undefined,
      actionUrl: undefined,
    });
    expect(parsePushData(null)).toEqual({});
  });
  it('follows only known in-app paths', () => {
    expect(inAppHref('/dashboard/grammar')).toBe('/learn/grammar');
    expect(inAppHref('//evil.example')).toBeNull();
    expect(inAppHref('https://evil.example')).toBeNull();
    expect(inAppHref('/nowhere')).toBeNull();
    expect(inAppHref(null)).toBeNull();
  });
});

describe('push registration', () => {
  it('reports the permission state', async () => {
    n.getPermissionsAsync
      .mockResolvedValueOnce(granted)
      .mockResolvedValueOnce(undetermined)
      .mockResolvedValueOnce(denied);
    expect(await getPushState()).toBe('granted');
    expect(await getPushState()).toBe('undetermined');
    expect(await getPushState()).toBe('denied');
  });

  it('registers silently when already allowed, and never prompts', async () => {
    n.getPermissionsAsync.mockResolvedValue(granted);
    expect(await syncPushRegistration()).toBe('granted');
    expect(api.registerDevice).toHaveBeenCalledWith(
      'ExponentPushToken[abc]',
      expect.stringMatching(/ios|android/),
    );
    expect(n.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('does not register (or prompt) while permission is undetermined', async () => {
    n.getPermissionsAsync.mockResolvedValue(undetermined);
    expect(await syncPushRegistration()).toBe('undetermined');
    expect(api.registerDevice).not.toHaveBeenCalled();
    expect(n.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('asks for permission on request and registers when granted', async () => {
    n.getPermissionsAsync.mockResolvedValue(undetermined);
    n.requestPermissionsAsync.mockResolvedValue(granted);
    expect(await enablePush()).toBe('granted');
    expect(api.registerDevice).toHaveBeenCalled();
  });

  it('does not register when the learner declines', async () => {
    n.getPermissionsAsync.mockResolvedValue(undetermined);
    n.requestPermissionsAsync.mockResolvedValue({
      status: 'denied',
      canAskAgain: false,
    } as Notifications.NotificationPermissionsStatus);
    n.getPermissionsAsync.mockResolvedValueOnce(undetermined).mockResolvedValueOnce(denied);
    expect(await enablePush()).toBe('denied');
    expect(api.registerDevice).not.toHaveBeenCalled();
  });

  it('survives a registration failure', async () => {
    n.getPermissionsAsync.mockResolvedValue(granted);
    api.registerDevice.mockRejectedValue(new Error('offline'));
    await expect(syncPushRegistration()).resolves.toBe('unsupported');
  });

  it('unregisters the stored token once, then forgets it', async () => {
    n.getPermissionsAsync.mockResolvedValue(granted);
    await syncPushRegistration();
    await unregisterPush();
    await unregisterPush();
    expect(api.unregisterDevice).toHaveBeenCalledTimes(1);
    expect(api.unregisterDevice).toHaveBeenCalledWith('ExponentPushToken[abc]');
  });

  it('unregistering without a token or with a failing request never throws', async () => {
    await expect(unregisterPush()).resolves.toBeUndefined();
    await AsyncStorage.setItem('push.expoToken', 'ExponentPushToken[x]');
    api.unregisterDevice.mockRejectedValue(new Error('401'));
    await expect(unregisterPush()).resolves.toBeUndefined();
  });
});

describe('usePushNotifications', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
  );
  const response = (identifier: string, data: Record<string, unknown>) =>
    ({
      notification: { request: { identifier, content: { data } } },
    }) as unknown as Notifications.NotificationResponse;

  let onTap: (r: Notifications.NotificationResponse) => void;
  beforeEach(() => {
    n.getPermissionsAsync.mockResolvedValue(undetermined);
    n.getLastNotificationResponse.mockReturnValue(null);
    n.addNotificationResponseReceivedListener.mockImplementation((cb) => {
      onTap = cb;
      return { remove: jest.fn() };
    });
    n.addNotificationReceivedListener.mockReturnValue({ remove: jest.fn() });
  });

  it('opens the destination of a tapped push and records the click', async () => {
    api.click.mockResolvedValue({ actionUrl: '/dashboard/exam-prep/exercise?id=e7' } as never);
    await renderHook(usePushNotifications, { wrapper });
    onTap(response('t1', { notificationId: 'ntf-1', actionUrl: '/dashboard/grammar' }));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/exam-prep/exercise/[exerciseId]',
        params: { exerciseId: 'e7' },
      }),
    );
    expect(api.click).toHaveBeenCalledWith('ntf-1');
  });

  it('falls back to the payload destination when the click request fails', async () => {
    api.click.mockRejectedValue(new Error('offline'));
    await renderHook(usePushNotifications, { wrapper });
    onTap(response('t2', { notificationId: 'ntf-2', actionUrl: '/dashboard/grammar' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/learn/grammar'));
  });

  it('opens the inbox when the destination is unknown or unsafe', async () => {
    api.click.mockResolvedValue({ actionUrl: '//evil.example' } as never);
    await renderHook(usePushNotifications, { wrapper });
    onTap(response('t3', { notificationId: 'ntf-3' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/settings/notifications'));
  });

  it('handles the tap that launched the app, once', async () => {
    n.getLastNotificationResponse.mockReturnValue(
      response('cold', { notificationId: 'ntf-4', actionUrl: '/dashboard/grammar' }),
    );
    api.click.mockResolvedValue({ actionUrl: '/dashboard/grammar' } as never);
    const first = await renderHook(usePushNotifications, { wrapper });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/learn/grammar'));
    await first.unmount();
    mockPush.mockClear();
    await renderHook(usePushNotifications, { wrapper }); // e.g. the layout remounting after sign-in
    await new Promise((r) => setTimeout(r, 20));
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('PushCard', () => {
  const wrap = () =>
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <PushCard />
      </QueryClientProvider>,
    );

  it('offers to enable push and flips to active once allowed', async () => {
    n.getPermissionsAsync.mockResolvedValue(undetermined);
    n.requestPermissionsAsync.mockResolvedValue(granted);
    await wrap();
    await fireEvent.press(await screen.findByRole('button', { name: 'Enable push' }));
    expect(await screen.findByText(/Active on this device/)).toBeTruthy();
    expect(api.registerDevice).toHaveBeenCalled();
  });

  it('points to the system settings when notifications are blocked', async () => {
    n.getPermissionsAsync.mockResolvedValue(denied);
    const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    await wrap();
    await fireEvent.press(await screen.findByRole('button', { name: 'Open settings' }));
    expect(open).toHaveBeenCalled();
  });
});
