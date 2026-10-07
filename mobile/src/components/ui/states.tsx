import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { LimitNotice } from './LimitNotice';
import { ApiError, fallbackMessage, isRetryable } from '@/api/errors';
import { NoConnectionIllustration, NotFoundIllustration } from './StateIllustrations';
import { useI18n } from '@/i18n';
import { colors, spacing } from '@/theme';

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  label ??= t.common.loading;
  return (
    <View
      style={styles.center}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <ActivityIndicator color={colors.primary} />
      <AppText variant="small" color={colors.mutedForeground}>
        {label}
      </AppText>
    </View>
  );
}

type EmptyProps = {
  emoji?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ emoji = '🎉', title, message, actionLabel, onAction }: EmptyProps) {
  return (
    <View style={styles.center}>
      {/* A search that found nothing gets the "not found" picture instead of an emoji. */}
      {emoji === '🔍' ? (
        <NotFoundIllustration width={230} />
      ) : (
        <AppText style={styles.emoji} accessibilityElementsHidden>
          {emoji}
        </AppText>
      )}
      <AppText variant="heading" center>
        {title}
      </AppText>
      {message ? (
        <AppText color={colors.mutedForeground} center>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button pill label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

type ErrorProps = { error?: unknown; onRetry?: () => void };

/**
 * Consistent error UI: friendly message from the normalized ApiError, retry when it can help.
 * No connection and "not found" get their own illustrated pages.
 */
export function ErrorState({ error, onRetry }: ErrorProps) {
  const { t } = useI18n();
  const message = error instanceof ApiError ? error.message : fallbackMessage('unknown');
  const kind = error instanceof ApiError ? error.kind : null;
  const canRetry = !!onRetry && (error === undefined || isRetryable(error));

  if (kind === 'network' || kind === 'notFound') {
    const offline = kind === 'network';
    return (
      <View style={styles.page} accessibilityRole="alert">
        {offline ? <NoConnectionIllustration /> : <NotFoundIllustration />}
        <AppText style={styles.pageTitle} center accessibilityRole="header">
          {offline ? t.common.notConnected : t.common.notFound}
        </AppText>
        <AppText color={colors.ink} center style={styles.pageText}>
          {message}
        </AppText>
        {canRetry ? <Button pill label={t.common.retry} onPress={onRetry} /> : null}
      </View>
    );
  }

  if (kind === 'limit') {
    return (
      <View style={styles.limit}>
        <LimitNotice />
      </View>
    );
  }

  return (
    <View style={styles.center} accessibilityRole="alert">
      <AppText style={styles.emoji} accessibilityElementsHidden>
        ⚠️
      </AppText>
      <AppText color={colors.mutedForeground} center>
        {message}
      </AppText>
      {canRetry ? <Button label={t.common.retry} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

/** A short error under a control: the limit card when a free allowance ran out, red text otherwise. */
export function InlineError({ error }: { error: unknown }) {
  if (!error) return null;
  if (error instanceof ApiError && error.kind === 'limit') return <LimitNotice />;
  const message = error instanceof ApiError ? error.message : fallbackMessage('unknown');
  return (
    <AppText color={colors.destructive} accessibilityRole="alert">
      {message}
    </AppText>
  );
}

const styles = StyleSheet.create({
  limit: { padding: spacing.lg },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emoji: { fontSize: 40, lineHeight: 48 },
  page: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  pageTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: '#000000',
    marginTop: spacing.md,
  },
  pageText: { fontSize: 16, lineHeight: 24, marginBottom: spacing.md },
});
