import { AppText } from '@/components/ui';
import { colors } from '@/theme';
import type { AiFeature, AiFeatureUsage } from '@/types/aiUsage';
import { useAiUsage } from './hooks';

export function aiUsageText(usage: AiFeatureUsage): { text: string; warn: boolean } {
  if (!usage.enabled) return { text: 'Diese Funktion ist derzeit nicht verfügbar.', warn: true };
  if (usage.remaining <= 0) return { text: 'Tageslimit erreicht – morgen geht es weiter.', warn: true };
  return { text: `Noch ${usage.remaining} von ${usage.limit} heute`, warn: usage.remaining === 1 };
}

/** "Noch 3 von 5 heute" for a limited AI feature; renders nothing when there is no limit. */
export function AiUsageHint({ feature }: { feature: AiFeature }) {
  const usage = useAiUsage(feature);
  if (!usage) return null;
  const { text, warn } = aiUsageText(usage);
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
