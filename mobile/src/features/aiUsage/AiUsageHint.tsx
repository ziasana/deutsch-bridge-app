import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, LimitNotice } from '@/components/ui';
import { useI18n } from '@/i18n';
import type { Dictionary } from '@/i18n/translations';
import { colors, radius, spacing } from '@/theme';
import type { AiFeature, AiFeatureUsage } from '@/types/aiUsage';
import { useAiUsage } from './hooks';

const AMBER = '#E8A21A';
const AMBER_DARK = '#8A5A00';

export function aiUsageText(
  usage: AiFeatureUsage,
  t: Dictionary['aiUsage'],
): { text: string; warn: boolean } {
  if (!usage.enabled) return { text: t.unavailable, warn: true };
  if (usage.remaining <= 0) return { text: t.limitReached, warn: true };
  return { text: t.remaining(usage.remaining, usage.limit), warn: usage.remaining === 1 };
}

/** The allowance as a row of dots: filled while there are requests left today. */
function Dots({ used, limit, color }: { used: number; limit: number; color: string }) {
  if (limit <= 0 || limit > 10) return null;
  return (
    <View
      style={styles.dots}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: limit }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, { backgroundColor: i < limit - used ? color : colors.border }]}
        />
      ))}
    </View>
  );
}

/**
 * What is left of a limited AI feature today: a small pill with the remaining requests, turning into a
 * card with an upgrade button once the limit is reached. Renders nothing when there is no limit.
 */
export function AiUsageHint({ feature }: { feature: AiFeature }) {
  const { t } = useI18n();
  const usage = useAiUsage(feature);
  if (!usage) return null;
  const u = t.aiUsage;
  const { text, warn } = aiUsageText(usage, u);

  if (usage.enabled && usage.remaining <= 0) return <LimitNotice />;

  const tone = warn ? AMBER : colors.primary;
  return (
    <View
      style={[styles.pill, warn && { backgroundColor: `${AMBER}1F` }]}
      accessibilityLiveRegion="polite"
      accessible
      accessibilityLabel={text}
    >
      <Ionicons
        name={warn ? 'flash' : 'sparkles'}
        size={14}
        color={warn ? AMBER_DARK : colors.primaryDark}
      />
      <AppText
        variant="small"
        color={warn ? AMBER_DARK : colors.primaryDark}
        style={{ fontWeight: '700' }}
      >
        {text}
      </AppText>
      {usage.enabled ? <Dots used={usage.used} limit={usage.limit} color={tone} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  dots: { flexDirection: 'row', gap: 3, marginStart: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
