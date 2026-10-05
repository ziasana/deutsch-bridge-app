import { RefreshControl, StyleSheet, View } from 'react-native';
import { AppText, Badge, ErrorState, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { ContinueCard, FocusCard, MilestoneCard, ReviewCard, TodayPlanCard, WeekCard } from './components/DashboardCards';
import { useDashboard } from './hooks';
import { headline, statusMessage } from './viewModel';

export function DashboardScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useDashboard();

  return (
    <Screen
      bottomInset={false}
      refreshControl={<RefreshControl refreshing={isRefetching && !isPending} onRefresh={() => void refetch()} />}
    >
      {isPending ? <DashboardSkeleton /> : null}
      {isError && !data ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}
      {data ? (
        <>
          <View style={styles.header}>
            <AppText variant="title" accessibilityRole="header">
              {headline(data, new Date().getHours())}
            </AppText>
            <AppText color={colors.mutedForeground}>{statusMessage(data)}</AppText>
            <View style={styles.chips}>
              {data.currentStreak > 0 ? <Badge tone="warning" label={`🔥 ${data.currentStreak} ${data.currentStreak === 1 ? 'Tag' : 'Tage'}`} /> : null}
              <Badge tone="primary" label={data.user.learningLevel} />
            </View>
          </View>
          <ContinueCard data={data} />
          <TodayPlanCard data={data} />
          <ReviewCard data={data} />
          <FocusCard data={data} />
          <WeekCard data={data} />
          <MilestoneCard data={data} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
