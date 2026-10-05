import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { notificationApi } from '@/api/notificationApi';

/**
 * unsupported   – no push on this platform/build (web, or no EAS project id configured)
 * undetermined  – the learner hasn't been asked yet
 * denied        – the learner (or the system) turned notifications off for the app
 * granted       – this device can receive pushes
 */
export type PushState = 'unsupported' | 'undetermined' | 'denied' | 'granted';

const TOKEN_KEY = 'push.expoToken';
const ANDROID_CHANNEL = 'default';

/** Show a banner while the app is open, so a new notification isn't missed. */
export function configurePushHandler(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export type PushPayload = { notificationId?: string; actionUrl?: string };

/** Reads what the backend put in a push's `data`; anything unexpected is ignored. */
export function parsePushData(data: unknown): PushPayload {
  if (!data || typeof data !== 'object') return {};
  const { notificationId, actionUrl } = data as Record<string, unknown>;
  return {
    notificationId: typeof notificationId === 'string' ? notificationId : undefined,
    actionUrl: typeof actionUrl === 'string' ? actionUrl : undefined,
  };
}

const projectId = (): string | undefined =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

export async function getPushState(): Promise<PushState> {
  if (Platform.OS === 'web' || !projectId()) return 'unsupported';
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  return status === 'denied' && !canAskAgain ? 'denied' : 'undetermined';
}

async function registerCurrentDevice(): Promise<void> {
  if (Platform.OS === 'android') {
    // Android only shows the permission prompt once a channel exists.
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'Erinnerungen',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
  await notificationApi.registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

/** Quietly (re-)registers the device when the learner already allowed notifications. Never prompts. */
export async function syncPushRegistration(): Promise<PushState> {
  try {
    const state = await getPushState();
    if (state === 'granted') await registerCurrentDevice();
    return state;
  } catch {
    return 'unsupported'; // e.g. Expo Go on Android, or offline: try again next launch
  }
}

/** Asks for permission (once the OS allows it) and registers the device. */
export async function enablePush(): Promise<PushState> {
  try {
    if ((await getPushState()) === 'unsupported') return 'unsupported';
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return getPushState();
    await registerCurrentDevice();
    return 'granted';
  } catch {
    return 'unsupported';
  }
}

/**
 * Stops pushes for the current account on this device (sign-out). The stored token is forgotten
 * first, so a failing request - e.g. an expired session ending itself - can't loop back here.
 */
export async function unregisterPush(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await notificationApi.unregisterDevice(token);
  } catch {
    // Best effort: the backend also drops tokens the push service reports as dead.
  }
}
