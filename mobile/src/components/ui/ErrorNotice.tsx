import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api/errors';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

type IconName = keyof typeof Ionicons.glyphMap;

const TONES: Record<'error' | 'offline', { icon: IconName; tint: string; dark: string }> = {
  error: { icon: 'alert-circle', tint: colors.destructive, dark: '#B42318' },
  offline: { icon: 'cloud-offline', tint: colors.warning, dark: '#8A5A00' },
};

/**
 * A friendly error card: tinted background, a round icon badge (offline gets its own look) and the
 * message in readable dark text. Pass the thrown `error` (an ApiError picks the tone) or a plain `message`.
 */
export function ErrorNotice({ error, message }: { error?: unknown; message?: string }) {
  const text = message ?? (error instanceof Error ? error.message : undefined);
  const offline = error instanceof ApiError && error.kind === 'network';
  const tone = TONES[offline ? 'offline' : 'error'];
  const [anim] = useState(() => ({ shake: new Animated.Value(0), fade: new Animated.Value(0) }));

  useEffect(() => {
    const native = { useNativeDriver: true };
    anim.fade.setValue(0);
    Animated.timing(anim.fade, { toValue: 1, duration: 220, ...native }).start();
    Animated.sequence([
      Animated.timing(anim.shake, { toValue: -6, duration: 50, ...native }),
      Animated.timing(anim.shake, { toValue: 6, duration: 80, ...native }),
      Animated.timing(anim.shake, { toValue: -4, duration: 70, ...native }),
      Animated.timing(anim.shake, { toValue: 0, duration: 50, ...native }),
    ]).start();
  }, [text, anim]);

  if (!text) return null;
  return (
    <Animated.View style={{ opacity: anim.fade, transform: [{ translateX: anim.shake }] }}>
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[styles.card, { borderColor: `${tone.tint}55`, backgroundColor: `${tone.tint}12` }]}
      >
        <View style={[styles.badge, { backgroundColor: `${tone.tint}26` }]}>
          <Ionicons name={tone.icon} size={20} color={tone.dark} />
        </View>
        <AppText variant="small" color={colors.foreground} style={styles.text}>
          {text}
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, fontWeight: '600' },
});
