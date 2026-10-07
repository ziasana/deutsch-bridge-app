import { Stack } from 'expo-router';
import { useHydrateDownloads } from '@/features/downloads/hooks';
import { useOfflineSync } from '@/features/downloads/useOfflineSync';
import { usePushNotifications } from '@/features/notifications/usePushNotifications';

export const unstable_settings = { initialRouteName: '(tabs)' };

// Tabs are the stable root; feature screens (learn/*, progress, settings…) push above them,
// so the system/Android back button returns to the originating tab.
export default function AppLayout() {
  usePushNotifications();
  useHydrateDownloads();
  useOfflineSync();
  return <Stack screenOptions={{ headerShown: false }} />;
}
