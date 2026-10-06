import { Redirect, router } from 'expo-router';
import { useCallback } from 'react';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/authStore';
import { SplashIntro, hasPlayedIntro, markIntroPlayed } from '@/features/welcome/SplashIntro';

// Entry route: signed-in users go home; everyone else sees the animated intro once per launch,
// then the welcome page.
export default function Index() {
  const status = useAuthStore((s) => s.status);
  const needsOnboarding = useAuthStore((s) => s.profile?.onboardingCompleted === false);
  const finish = useCallback(() => {
    markIntroPlayed();
    router.replace('/welcome');
  }, []);

  if (env.onboardingPreview) return <Redirect href="/onboarding" />;
  if (status === 'authenticated')
    return <Redirect href={needsOnboarding ? '/onboarding' : '/home'} />;
  if (hasPlayedIntro()) return <Redirect href="/welcome" />;
  return <SplashIntro onDone={finish} />;
}
