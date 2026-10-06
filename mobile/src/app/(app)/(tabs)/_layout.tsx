import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { notificationKeys, useUnreadCount } from '@/features/notifications/hooks';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: {
  name: 'home' | 'learn' | 'exam' | 'tutor' | 'profile';
  icon: IconName;
  iconActive: IconName;
}[] = [
  { name: 'home', icon: 'home-outline', iconActive: 'home' },
  { name: 'learn', icon: 'book-outline', iconActive: 'book' },
  { name: 'exam', icon: 'ribbon-outline', iconActive: 'ribbon' },
  { name: 'tutor', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  { name: 'profile', icon: 'person-outline', iconActive: 'person' },
];

export const unstable_settings = { initialRouteName: 'home' };

// The five primary destinations are fixed; everything else is pushed above them.
export default function TabsLayout() {
  const queryClient = useQueryClient();
  const unread = useUnreadCount().data ?? 0;
  const { t: tr } = useI18n();

  // Coming back to the app (e.g. after a push arrived while it was closed) refreshes the badge.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
      }
    });
    return () => sub.remove();
  }, [queryClient]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.ink,
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: colors.border, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: tr.tabs[t.name],
            // Unread notifications live under Profile; the badge tells the learner they exist.
            tabBarBadge:
              t.name === 'profile' && unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
            tabBarBadgeStyle: { backgroundColor: '#F2703D', color: '#FFFFFF', fontWeight: '700' },
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? t.iconActive : t.icon} color={color} size={size + 4} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
