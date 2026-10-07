import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { PressableScale } from '@/features/exam/components/kit';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

const AMBER = '#E8A21A';
const AMBER_DARK = '#8A5A00';

/**
 * "Daily limit reached": a soft amber card with the reset hint and a button to Premium. One look for
 * every place a free allowance runs out (usage hint, API errors, inline AI errors).
 */
export function LimitNotice() {
  const { t } = useI18n();
  const u = t.aiUsage;
  return (
    <View style={styles.card} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.moon}>
        <Ionicons name="moon" size={22} color={AMBER_DARK} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subheading">{u.limitTitle}</AppText>
        <AppText variant="small" color={colors.mutedForeground}>
          {u.limitHint}
        </AppText>
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={u.upgradeLabel}
        onPress={() => router.push('/premium')}
        style={styles.upgrade}
      >
        <Ionicons name="sparkles" size={14} color="#FFFFFF" />
        <AppText variant="small" color="#FFFFFF" style={{ fontWeight: '800' }}>
          {u.upgrade}
        </AppText>
      </PressableScale>
    </View>
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
    borderColor: `${AMBER}66`,
    backgroundColor: `${AMBER}14`,
  },
  moon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${AMBER}33`,
  },
  upgrade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
