import { RefreshControl, StyleSheet, View } from 'react-native';
import { HomeIllustration } from '@/components/ui/HeroIllustrations';
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
import {
  ExamInsightCard,
  NewContentBanner,
  QuickAccess,
  RedemittelHomeCard,
  SavedLessonsBanner,
  StatsRow,
} from './components/HomeExtras';
import { Reveal } from './components/Reveal';
import { useDashboard, usePendingBookmarkCount } from './hooks';
import { headline, isNewLearner, statusMessage } from './viewModel';

export function DashboardScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useDashboard();
  const name = useAuthStore((s) => s.profile?.displayName);
  const pending = usePendingBookmarkCount().data ?? 0;

  return (
    <HeroScreen
      art={
        <HomeIllustration
          completed={data?.today.completed}
          total={data?.today.total}
          streak={data?.currentStreak}
        />
      }
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
          {(data.newContent?.total ?? 0) > 0 || pending > 0 ? (
            <Reveal index={1}>
              <View style={styles.banners}>
                <NewContentBanner data={data} />
                <SavedLessonsBanner />
              </View>
            </Reveal>
          ) : null}
          <Reveal index={1}>
            <ContinueCard data={data} />
          </Reveal>
          <Reveal index={2}>
            <TodayPlanCard data={data} />
          </Reveal>
          {isNewLearner(data) ? null : (
            <Reveal index={3}>
              <StatsRow data={data} />
            </Reveal>
          )}
          <Reveal index={3}>
            <QuickAccess />
          </Reveal>
          <Reveal index={4}>
            <ReviewCard data={data} />
          </Reveal>
          <Reveal index={4}>
            <RedemittelHomeCard />
          </Reveal>
          <Reveal index={4}>
            <FocusCard data={data} />
          </Reveal>
          <Reveal index={5}>
            <ExamInsightCard />
          </Reveal>
          <Reveal index={5}>
            <WeekCard data={data} />
          </Reveal>
          <Reveal index={6}>
            <MilestoneCard data={data} />
          </Reveal>
        </>
      ) : null}
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  banners: { gap: spacing.sm },
});
