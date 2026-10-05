import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Button, SecondaryButton } from './Button';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { colors, spacing } from '@/theme';

type Action = { label: string; onPress: () => void };

type Props = {
  title: string; // e.g. "Sehr gut!"
  subtitle?: string; // e.g. "Daily Words abgeschlossen"
  /** "5 / 5 Wörter gelernt" */
  progressLabel?: string;
  progress?: { value: number; max: number };
  encouragement?: string;
  illustration?: ReactNode;
  primaryAction?: Action; // next recommended action
  secondaryAction?: Action;
};

/** Shared completion screen content for every learning activity. Calm, adult, no confetti. */
export function LearningCelebration({
  title,
  subtitle,
  progressLabel,
  progress,
  encouragement,
  illustration,
  primaryAction,
  secondaryAction,
}: Props) {
  return (
    <Card tone="accent" style={styles.card}>
      {illustration ?? (
        <AppText style={styles.emoji} accessibilityElementsHidden>
          🎉
        </AppText>
      )}
      <AppText variant="title" center accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? (
        <AppText center color={colors.mutedForeground}>
          {subtitle}
        </AppText>
      ) : null}
      {progress ? (
        <View style={styles.progress}>
          <ProgressBar value={progress.value} max={progress.max} />
          {progressLabel ? (
            <AppText variant="small" center color={colors.mutedForeground}>
              {progressLabel}
            </AppText>
          ) : null}
        </View>
      ) : null}
      {encouragement ? (
        <AppText center variant="small">
          {encouragement}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        {primaryAction ? <Button {...primaryAction} /> : null}
        {secondaryAction ? <SecondaryButton {...secondaryAction} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'stretch', gap: spacing.md, padding: spacing.xl },
  emoji: { fontSize: 48, lineHeight: 56, textAlign: 'center' },
  progress: { gap: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
