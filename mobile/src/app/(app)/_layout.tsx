import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

// Tabs are the stable root; feature screens (learn/*, progress, settings…) push above them,
// so the system/Android back button returns to the originating tab.
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
