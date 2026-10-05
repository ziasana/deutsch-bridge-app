import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { notificationApi } from '@/api/notificationApi';
import { inAppHref, NO_DESTINATION } from './destination';
import { notificationKeys } from './hooks';
import { parsePushData, syncPushRegistration } from './push';

// A tap that launched the app stays available as "last response"; handle each one only once.
let lastHandledId: string | null = null;

/**
 * Mounted once for the signed-in app: keeps this device registered for push, refreshes the
 * notification counters when one arrives, and opens the right screen when one is tapped
 * (also when the tap cold-started the app).
 */
export function usePushNotifications(): void {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void syncPushRegistration();

    const open = async (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.identifier;
      if (id === lastHandledId) return;
      lastHandledId = id;

      const { notificationId, actionUrl } = parsePushData(response.notification.request.content.data);
      let destination = actionUrl;
      if (notificationId) {
        try {
          // Marks it read and returns the authoritative destination.
          destination = (await notificationApi.click(notificationId)).actionUrl ?? actionUrl;
        } catch {
          // The click is only bookkeeping; still take the learner there.
        }
        void queryClient.invalidateQueries({ queryKey: notificationKeys.root });
      }
      router.push(inAppHref(destination) ?? NO_DESTINATION);
    };

    const initial = Notifications.getLastNotificationResponse();
    if (initial?.notification) void open(initial);

    const tapped = Notifications.addNotificationResponseReceivedListener((r) => void open(r));
    const received = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.root });
    });
    return () => {
      tapped.remove();
      received.remove();
    };
  }, [router, queryClient]);
}
