import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { ApiError, fallbackMessage, isRetryable } from '@/api/errors';
import { colors, spacing } from '@/theme';

export function LoadingState({ label = 'Lädt …' }: { label?: string }) {
  return (
    <View style={styles.center} accessible accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={colors.primary} />
      <AppText variant="small" color={colors.mutedForeground}>
        {label}
      </AppText>
    </View>
  );
}

type EmptyProps = { emoji?: string; title: string; message?: string; actionLabel?: string; onAction?: () => void };

export function EmptyState({ emoji = '🎉', title, message, actionLabel, onAction }: EmptyProps) {
  return (
    <View style={styles.center}>
      <AppText style={styles.emoji} accessibilityElementsHidden>
        {emoji}
      </AppText>
      <AppText variant="heading" center>
        {title}
      </AppText>
      {message ? (
        <AppText color={colors.mutedForeground} center>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

type ErrorProps = { error?: unknown; onRetry?: () => void };

/** Consistent error UI: friendly message from the normalized ApiError, retry when it can help. */
export function ErrorState({ error, onRetry }: ErrorProps) {
  const message = error instanceof ApiError ? error.message : fallbackMessage('unknown');
  return (
    <View style={styles.center} accessibilityRole="alert">
      <AppText style={styles.emoji} accessibilityElementsHidden>
        {error instanceof ApiError && error.kind === 'network' ? '📡' : '⚠️'}
      </AppText>
      <AppText color={colors.mutedForeground} center>
        {message}
      </AppText>
      {onRetry && (error === undefined || isRetryable(error)) ? (
        <Button label="Erneut versuchen" onPress={onRetry} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emoji: { fontSize: 40, lineHeight: 48 },
});
