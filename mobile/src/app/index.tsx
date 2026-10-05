import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

// Entry route: send the user to the right group once the session state is known.
export default function Index() {
  const status = useAuthStore((s) => s.status);
  return <Redirect href={status === 'authenticated' ? '/home' : '/login'} />;
}
