import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CACHE_MAX_AGE, queryClient } from '@/api/queryClient';
import { createQueryPersister, shouldPersistQuery } from '@/api/queryPersist';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { ErrorState } from '@/components/ui';
import { PremiumUpsellModal } from '@/features/premium/PremiumUpsellModal';
import { OfflineBanner } from '@/features/offline/OfflineBanner';
import { useConnectivity } from '@/features/offline/useConnectivity';
import { configurePushHandler } from '@/features/notifications/push';
import { env } from '@/config/env';
import { I18nProvider } from '@/i18n';
import { initSession, useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme';

export { AppErrorBoundary as ErrorBoundary };

void SplashScreen.preventAutoHideAsync();
initSession();
configurePushHandler();

function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  // New accounts (and old ones that never finished) set up their learning plan before the app opens.
  const needsOnboarding = useAuthStore((s) => s.profile?.onboardingCompleted === false);
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
      <Stack.Protected guard={status === 'authenticated' && !needsOnboarding}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected
        guard={env.onboardingPreview || (status === 'authenticated' && needsOnboarding)}
      >
        <Stack.Screen name="(onboarding)" />
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

const persister = createQueryPersister();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: CACHE_MAX_AGE,
          // A new app version may change payload shapes: start from an empty cache.
          buster: Constants.expoConfig?.version ?? '',
          dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
        }}
      >
        <StatusBar style="dark" />
        <I18nProvider>
          <RootNavigator />
          <ConnectivityNotice />
          <PremiumUpsellModal />
        </I18nProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
