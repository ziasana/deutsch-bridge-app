import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/api/queryClient';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { ErrorState } from '@/components/ui';
import { OfflineBanner } from '@/features/offline/OfflineBanner';
import { useConnectivity } from '@/features/offline/useConnectivity';
import { configurePushHandler } from '@/features/notifications/push';
import { initSession, useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme';

export { AppErrorBoundary as ErrorBoundary };

void SplashScreen.preventAutoHideAsync();
initSession();
configurePushHandler();

function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return null; // native splash stays up

  if (status === 'error') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <ErrorState error={error ?? undefined} onRetry={() => void restoreSession()} />
      </View>
    );
  }

  // Route guard: flipping auth status swaps the active group and redirects automatically.
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Protected guard={status === 'authenticated'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'unauthenticated'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

function ConnectivityNotice() {
  const { offline } = useConnectivity();
  return <OfflineBanner visible={offline} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RootNavigator />
        <ConnectivityNotice />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
