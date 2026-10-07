import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  Header,
  ProgressRing,
  Screen,
  Skeleton,
} from '@/components/ui';
import { HorizontalScroll } from '@/components/ui/HorizontalScroll';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';
import type { ExamSection } from '@/types/exam';
import { ExerciseRow } from './components/ExerciseRow';
import { IconButton, StatTile, tint } from './components/kit';
import { useExamText } from './examText';
import { effectiveScore, findGroupByKey } from './examData';
import { SECTION_META, SECTION_ORDER } from './examMeta';
import { useExamExercises, useToggleExamBookmark } from './hooks';
import { TIMED_SECTIONS } from './time/examTime';
import { useExerciseLastTimes } from './time/hooks';
import { TeilTimeCard } from './time/TeilTimeCard';
import { darken } from '@/features/exam/components/kit';
import { HeroBackdrop } from '@/components/ui/HeroDecor';
import { SectionIcon } from './components/SectionIcon';

type Filter = 'ALL' | 'OPEN' | 'DONE';
const FILTERS: Filter[] = ['ALL', 'OPEN', 'DONE'];

export function ExamTeilScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const tx = useExamText();
  const e = t.examTeil;
  const { section, level, part } = useLocalSearchParams<{
    section: string;
    level: string;
    part: string;
  }>();
  const valid = SECTION_ORDER.includes(section as ExamSection);
  const query = useExamExercises(valid ? level : null);
  const bookmark = useToggleExamBookmark();
  const lastTimes = useExerciseLastTimes(valid ? (section as ExamSection) : null, level);
  const [filter, setFilter] = useState<Filter>('ALL');

  const open = (id: string) =>
    router.push({ pathname: '/exam-prep/exercise/[exerciseId]', params: { exerciseId: id } });

  if (!valid) {
    return (
      <Screen>
        <Header title={e.title} back />
        <EmptyState
          emoji="🔍"
          title={e.notFoundTitle}
          message={e.notFoundMessage}
          actionLabel={t.common.back}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }
  if (query.isPending) {
    return (
      <Screen>
        <Header title={e.title} back />
        <View accessibilityLabel={e.loading} style={{ gap: spacing.md }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={72} />
          ))}
        </View>
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen>
        <Header title={e.title} back />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const typed = section as ExamSection;
  const group = findGroupByKey(query.data, typed, level, part);
  if (!group) {
    return (
      <Screen>
        <Header title={e.title} back />
        <EmptyState
          emoji="🔍"
          title={e.notFoundTitle}
          message={e.notFoundMessage}
          actionLabel={t.common.back}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const meta = SECTION_META[typed];
  const color = meta.color;
  const questions = group.items.reduce((sum, i) => sum + i.questionsCount, 0);
  const next = group.items.find((i) => effectiveScore(i) < 100) ?? group.items[0];
  const started = group.items.some((i) => i.completed);
  const continueLabel =
    group.state === 'completed'
      ? e.again(tx(next.title))
      : started
        ? e.resume(tx(next.title))
        : e.start(tx(next.title));
  const items = group.items.filter(
    (i) =>
      filter === 'ALL' || (filter === 'DONE' ? effectiveScore(i) === 100 : effectiveScore(i) < 100),
  );
  const nextId = group.state === 'completed' ? null : next.id;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: tint(color, '1F') }]}>
          <HeroBackdrop color={color} />
          <SafeAreaView edges={['top']}>
            <View style={styles.topRow}>
              <IconButton name="arrow-back" label={t.common.back} onPress={() => router.back()} />
              <View style={[styles.chip, styles.chipRow, { backgroundColor: tint(color, '33') }]}>
                <SectionIcon section={typed} size={14} />
                <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
                  {tx(meta.label).toUpperCase()} · {level}
                </AppText>
              </View>
            </View>
            <View style={styles.heroMain}>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText style={styles.title} accessibilityRole="header">
                  {tx(group.heading)}
                </AppText>
                {group.subheading ? (
                  <AppText color={colors.ink} style={{ fontWeight: '500' }}>
                    {tx(group.subheading)}
                  </AppText>
                ) : null}
              </View>
              <ProgressRing
                value={group.avgScore}
                size={84}
                stroke={9}
                color={color}
                textSize={20}
                trackColor="#FFFFFFCC"
                label={e.progress}
              />
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <View style={styles.tiles}>
            <StatTile
              icon="albums-outline"
              label={e.exercises(group.total)}
              value={String(group.total)}
              color={color}
            />
            <StatTile
              icon="help-circle-outline"
              label={e.questions(questions)}
              value={String(questions)}
              color={color}
            />
            <StatTile
              icon="checkmark-circle-outline"
              label={e.mastered}
              value={`${group.mastered} / ${group.total}`}
              color={colors.success}
            />
          </View>

          <Button pill label={continueLabel} onPress={() => open(next.id)} color={color} />

          {group.items[0]?.teil != null && TIMED_SECTIONS.includes(typed) ? (
            <TeilTimeCard section={typed} level={level} teil={group.items[0].teil} color={color} />
          ) : null}

          <View style={{ gap: spacing.sm }}>
            <AppText variant="heading">{e.path}</AppText>
            <HorizontalScroll
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {FILTERS.map((f) => (
                <Chip
                  key={f}
                  label={e.filters[f]}
                  selected={filter === f}
                  onPress={() => setFilter(f)}
                  color={darken(color)}
                />
              ))}
            </HorizontalScroll>
          </View>

          <View>
            {items.map((item, i) => (
              <ExerciseRow
                key={item.id}
                item={item}
                color={color}
                path={{ index: group.items.indexOf(item) + 1, last: i === items.length - 1 }}
                next={item.id === nextId}
                onPress={() => open(item.id)}
                onToggleBookmark={() =>
                  bookmark.mutate({ id: item.id, bookmarked: item.bookmarked })
                }
                bookmarkBusy={bookmark.isPending && bookmark.variables?.id === item.id}
                lastTime={lastTimes[item.id]}
              />
            ))}
            {items.length === 0 ? (
              <AppText
                center
                color={colors.mutedForeground}
                style={{ paddingVertical: spacing.xl }}
              >
                {e.emptyFilter}
              </AppText>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginStart: -spacing.sm,
  },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingTop: spacing.sm },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: colors.ink },
  body: { padding: spacing.lg, gap: spacing.lg },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
});
