import { Redirect, router } from 'expo-router';
import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { SplashIntro, hasPlayedIntro, markIntroPlayed } from '@/features/welcome/SplashIntro';

// Entry route: signed-in users go home; everyone else sees the animated intro once per launch,
// then the welcome page.
export default function Index() {
  const status = useAuthStore((s) => s.status);
  const finish = useCallback(() => {
    markIntroPlayed();
    router.replace('/welcome');
  }, []);

  if (status === 'authenticated') return <Redirect href="/home" />;
  if (hasPlayedIntro()) return <Redirect href="/welcome" />;
  return <SplashIntro onDone={finish} />;
}
