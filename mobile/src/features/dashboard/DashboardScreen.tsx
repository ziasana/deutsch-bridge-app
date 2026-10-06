import { RefreshControl, StyleSheet, View } from 'react-native';
import { Badge, ErrorState, HeroScreen } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { spacing } from '@/theme';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import {
  ContinueCard,
  FocusCard,
  MilestoneCard,
  ReviewCard,
  TodayPlanCard,
  WeekCard,
} from './components/DashboardCards';
import { useDashboard } from './hooks';
import { headline, statusMessage } from './viewModel';

export function DashboardScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useDashboard();
  const name = useAuthStore((s) => s.profile?.displayName);

  return (
    <HeroScreen
      title={
        data
          ? headline(data, new Date().getHours())
          : `Hallo${name ? `, ${name.split(' ')[0]}` : ''}!`
      }
      subtitle={data ? statusMessage(data) : 'Dein Lernplan wird geladen …'}
      refreshControl={
        <RefreshControl refreshing={isRefetching && !isPending} onRefresh={() => void refetch()} />
      }
    >
      {isPending ? <DashboardSkeleton /> : null}
      {isError && !data ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}
      {data ? (
        <>
          <View style={styles.chips}>
            {data.currentStreak > 0 ? (
              <Badge
                tone="warning"
                label={`🔥 ${data.currentStreak} ${data.currentStreak === 1 ? 'Tag' : 'Tage'}`}
              />
            ) : null}
            <Badge tone="primary" label={data.user.learningLevel} />
          </View>
          <ContinueCard data={data} />
          <TodayPlanCard data={data} />
          <ReviewCard data={data} />
          <FocusCard data={data} />
          <WeekCard data={data} />
          <MilestoneCard data={data} />
        </>
      ) : null}
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
