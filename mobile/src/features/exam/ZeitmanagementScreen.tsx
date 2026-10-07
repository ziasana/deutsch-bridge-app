import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, EmptyState, ErrorState, Header, Screen, Skeleton } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import { tint } from './components/kit';
import { useExamText } from './examText';
import { SECTION_META } from './examMeta';
import { formatClock, formatDifference } from './time/examTime';
import { useTimeManagement } from './time/hooks';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <AppText variant="caption" color={colors.mutedForeground}>
        {label}
      </AppText>
      <AppText style={{ fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
        {value}
      </AppText>
    </View>
  );
}

/** Average finished time per Teil next to the recommended time. */
export function ZeitmanagementScreen() {
  const { t } = useI18n();
  const tx = useExamText();
  const z = t.zeit;
  const params = useLocalSearchParams<{ level?: string }>();
  const profileLevel = useAuthStore((s) => s.profile?.learningLevel);
  const level = params.level || (profileLevel && profileLevel !== 'null' ? profileLevel : 'B1');
  const query = useTimeManagement(level);

  let body;
  if (query.isPending) {
    body = (
      <View accessibilityLabel={z.loading} style={{ gap: spacing.md }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={96} />
        ))}
      </View>
    );
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else if (query.data.length === 0) {
    body = <EmptyState emoji="⏱" title={z.emptyTitle} message={z.emptyMessage(level)} />;
  } else {
    body = (
      <View style={{ gap: spacing.md }}>
        {query.data.map((row) => {
          const within = row.differenceSeconds != null && row.differenceSeconds <= 0;
          const meta = SECTION_META[row.section];
          const hasTarget = row.targetSeconds != null && row.differenceSeconds != null;
          // Both bars share one scale so "slower than the goal" is visible at a glance.
          const scale = Math.max(row.averageSeconds, row.targetSeconds ?? 0, 1) * 1.1;
          const avgPct = (row.averageSeconds / scale) * 100;
          const targetPct = row.targetSeconds != null ? (row.targetSeconds / scale) * 100 : null;
          const barColor = !hasTarget
            ? (meta?.color ?? colors.primary)
            : within
              ? colors.success
              : colors.warning;
          return (
            <Card key={`${row.section}-${row.teil}`} style={{ gap: spacing.md }}>
              <View style={styles.head}>
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: tint(meta?.color ?? colors.primary, '1F') },
                  ]}
                >
                  <AppText style={{ fontSize: 22, lineHeight: 28 }}>{meta?.emoji}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="subheading">
                    {tx(z.part(meta?.label ?? row.section, row.teil))}
                  </AppText>
                  <AppText variant="small" color={colors.mutedForeground}>
                    {z.sessions(row.sessions)}
                  </AppText>
                </View>
              </View>
              <View
                style={styles.track}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <View style={[styles.fill, { width: `${avgPct}%`, backgroundColor: barColor }]} />
                {targetPct != null ? (
                  <View style={[styles.marker, { start: `${targetPct}%` }]} />
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl }}>
                <Stat label={z.average} value={formatClock(row.averageSeconds)} />
                {row.targetSeconds != null && row.differenceSeconds != null ? (
                  <>
                    <Stat label={z.recommended} value={formatClock(row.targetSeconds)} />
                    <Stat
                      label={z.difference}
                      value={`\u200E${formatDifference(row.differenceSeconds)}`}
                    />
                  </>
                ) : null}
              </View>
              {within ? <AppText color="#1B7A55">{z.within}</AppText> : null}
            </Card>
          );
        })}
      </View>
    );
  }

  return (
    <Screen>
      <Header title={z.title} subtitle={z.subtitle(level)} back />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  track: {
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
    overflow: 'visible',
  },
  fill: { height: 12, borderRadius: radius.pill },
  marker: {
    position: 'absolute',
    top: -4,
    width: 3,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.ink,
  },
});
