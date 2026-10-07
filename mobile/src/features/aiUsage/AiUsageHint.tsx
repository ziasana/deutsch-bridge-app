import { AppText } from '@/components/ui';
import { useI18n } from '@/i18n';
import type { Dictionary } from '@/i18n/translations';
import { colors } from '@/theme';
import type { AiFeature, AiFeatureUsage } from '@/types/aiUsage';
import { useAiUsage } from './hooks';

export function aiUsageText(
  usage: AiFeatureUsage,
  t: Dictionary['aiUsage'],
): { text: string; warn: boolean } {
  if (!usage.enabled) return { text: t.unavailable, warn: true };
  if (usage.remaining <= 0) return { text: t.limitReached, warn: true };
  return { text: t.remaining(usage.remaining, usage.limit), warn: usage.remaining === 1 };
}

/** "3 of 5 left today" for a limited AI feature; renders nothing when there is no limit. */
export function AiUsageHint({ feature }: { feature: AiFeature }) {
  const { t } = useI18n();
  const usage = useAiUsage(feature);
  if (!usage) return null;
  const { text, warn } = aiUsageText(usage, t.aiUsage);
  return (
    <AppText
      variant="small"
      accessibilityLiveRegion="polite"
      color={warn ? colors.destructive : colors.mutedForeground}
    >
      {text}
    </AppText>
  );
}
