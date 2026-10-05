import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'home', title: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'learn', title: 'Learn', icon: 'book-outline', iconActive: 'book' },
  { name: 'exam', title: 'Exam', icon: 'ribbon-outline', iconActive: 'ribbon' },
  { name: 'tutor', title: 'Tutor', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  { name: 'profile', title: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

export const unstable_settings = { initialRouteName: 'home' };

// The five primary destinations are fixed; everything else is pushed above them.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? t.iconActive : t.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
