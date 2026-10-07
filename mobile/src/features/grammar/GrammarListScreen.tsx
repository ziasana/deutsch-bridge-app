import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  Badge,
  Button,
  Card,
  Chip,
  DirectionalIcon,
  EmptyState,
  ErrorState,
  ProgressRing,
  Skeleton,
} from '@/components/ui';
import { IconButton, StatTile, tint } from '@/features/exam/components/kit';
import { HeroBackdrop } from '@/components/ui/HeroDecor';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { HorizontalScroll } from '@/components/ui/HorizontalScroll';
import { colors, radius, shadow, spacing } from '@/theme';
import type { GrammarCategorySummary, GrammarLessonSummary } from '@/types/grammar';
import { pickInitialLevel } from '@/utils/levels';
import { useLevelSummary, useLevelView } from './hooks';
import { localizedHeading } from './quiz';
import { GRAMMAR_COLOR, GRAMMAR_DARK } from './meta';

type Row =
  | { kind: 'category'; category: GrammarCategorySummary; expanded: boolean; index: number }
  | {
      kind: 'lesson';
      lesson: GrammarLessonSummary;
      /** 1-based position inside its category (0 for uncategorized lessons). */
      position: number;
      last: boolean;
      /** The first lesson of the category that is not learned yet. */
      next: boolean;
    }
  | { kind: 'test'; category: GrammarCategorySummary }
  | { kind: 'heading'; title: string };

/** Flattens categories (+ their lessons when expanded) and uncategorized lessons into one virtualized list. */
export function buildRows(
  categories: GrammarCategorySummary[],
  uncategorized: GrammarLessonSummary[],
  expanded: Record<string, boolean>,
  otherTopics = 'Weitere Themen',
): Row[] {
  const rows: Row[] = [];
  categories.forEach((category, c) => {
    const open = !!expanded[category.id];
    rows.push({ kind: 'category', category, expanded: open, index: c + 1 });
    if (open) {
      const nextId = category.lessons.find((l) => !l.learned)?.id;
      category.lessons.forEach((lesson, i) =>
        rows.push({
          kind: 'lesson',
          lesson,
          position: i + 1,
          last: i === category.lessons.length - 1,
          next: lesson.id === nextId,
        }),
      );
      if (category.lessons.some((l) => l.quizCount > 0)) rows.push({ kind: 'test', category });
    }
  });
  if (uncategorized.length > 0) {
    if (categories.length > 0) rows.push({ kind: 'heading', title: otherTopics });
    uncategorized.forEach((lesson, i) =>
      rows.push({
        kind: 'lesson',
        lesson,
        position: i + 1,
        last: i === uncategorized.length - 1,
        next: false,
      }),
    );
  }
  return rows;
}

export const learnedIn = (lessons: GrammarLessonSummary[]) =>
  lessons.filter((l) => l.learned).length;

function ListSkeleton() {
  const { t } = useI18n();
  return (
    <View accessibilityLabel={t.grammar.loading} style={{ gap: spacing.md }}>
      {[0, 1, 2].map((i) => (
        <Card key={i} style={{ gap: spacing.sm }}>
          <Skeleton width="60%" height={20} />
          <Skeleton height={14} />
        </Card>
      ))}
    </View>
  );
}

export function GrammarListScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const g = t.grammar;
  const persian = useAuthStore((s) => s.profile?.preferredLanguage === 'PR');
  const profileLevel = useAuthStore((s) => s.profile?.learningLevel);
  const summary = useLevelSummary();
  const [picked, setPicked] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [onlySaved, setOnlySaved] = useState(false);

  const summaries = useMemo(() => summary.data ?? [], [summary.data]);
  const level = picked ?? pickInitialLevel(profileLevel, summaries);
  const view = useLevelView(level);

  const rows = useMemo(() => {
    if (!onlySaved) {
      return buildRows(
        view.data?.categories ?? [],
        view.data?.uncategorized ?? [],
        expanded,
        g.otherTopics,
      );
    }
    const saved = [
      ...(view.data?.categories ?? []).flatMap((c) => c.lessons),
      ...(view.data?.uncategorized ?? []),
    ].filter((l) => l.bookmarked);
    return saved.map<Row>((lesson, i) => ({
      kind: 'lesson',
      lesson,
      position: 0,
      last: i === saved.length - 1,
      next: false,
    }));
  }, [view.data, expanded, onlySaved, g.otherTopics]);

  const refresh = () => {
    void summary.refetch();
    void view.refetch();
  };

  const openLesson = (id: string) =>
    router.push({ pathname: '/grammar/[lessonId]', params: { lessonId: id } });

  const current = summaries.find((s) => s.level === level);
  const allLessons = [
    ...(view.data?.categories ?? []).flatMap((c) => c.lessons),
    ...(view.data?.uncategorized ?? []),
  ];
  const nextLesson = allLessons.find((l) => !l.learned);
  const percent = current && current.total > 0 ? (current.learned / current.total) * 100 : 0;
  const bookmarked = allLessons.filter((l) => l.bookmarked).length;
  const categoryCount = view.data?.categories.length ?? 0;

  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
      <View style={[styles.hero, { backgroundColor: tint(GRAMMAR_COLOR, '1F') }]}>
        <HeroBackdrop color={GRAMMAR_COLOR} />
        <SafeAreaView edges={['top']}>
          <View style={styles.topRow}>
            <IconButton name="arrow-back" label={t.common.back} onPress={() => router.back()} />
            <View style={[styles.chip, { backgroundColor: tint(GRAMMAR_COLOR, '33') }]}>
              <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
                {g.chip(level)}
              </AppText>
            </View>
          </View>
          <View style={styles.heroMain}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText style={styles.title} accessibilityRole="header">
                {g.title}
              </AppText>
              <AppText color={colors.ink} style={{ fontWeight: '500' }}>
                {g.subtitle}
              </AppText>
            </View>
            {current ? (
              <ProgressRing
                value={percent}
                size={84}
                stroke={9}
                color={GRAMMAR_COLOR}
                textSize={20}
                trackColor="#FFFFFFCC"
                label={g.levelProgress(level ?? '')}
              />
            ) : null}
          </View>
        </SafeAreaView>
      </View>

      {summaries.length > 0 ? (
        <HorizontalScroll
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levels}
          style={{ flexGrow: 0 }}
        >
          {summaries.map((s) => (
            <LevelTile
              key={s.level}
              level={s.level}
              learned={s.learned}
              total={s.total}
              selected={s.level === level}
              onPress={() => setPicked(s.level)}
            />
          ))}
        </HorizontalScroll>
      ) : null}

      {view.data ? (
        <View style={styles.pad}>
          <View style={styles.tiles}>
            <StatTile
              icon="checkmark-circle-outline"
              label={g.tileDone}
              value={`${current?.learned ?? 0} / ${current?.total ?? 0}`}
              color={colors.success}
            />
            <StatTile
              icon="folder-open-outline"
              label={g.tileBlocks}
              value={String(categoryCount)}
              color={GRAMMAR_COLOR}
            />
            <StatTile
              icon="star-outline"
              label={g.tileSaved}
              value={String(bookmarked)}
              color={colors.warning}
            />
          </View>
          <View style={styles.filters}>
            <Chip
              label={g.allTopics}
              selected={!onlySaved}
              onPress={() => setOnlySaved(false)}
              color={GRAMMAR_DARK}
            />
            <Chip
              label={g.savedFilter(bookmarked)}
              selected={onlySaved}
              onPress={() => setOnlySaved(true)}
              color={GRAMMAR_DARK}
            />
          </View>
          {nextLesson && !onlySaved ? (
            <View style={{ marginTop: spacing.md }}>
              <Button
                pill
                label={g.nextLesson(
                  current?.learned ? g.continue : g.start,
                  localizedHeading(nextLesson, persian).title,
                )}
                onPress={() => openLesson(nextLesson.id)}
                color={GRAMMAR_COLOR}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  let content;
  if (summary.isPending || (view.isPending && !!level)) {
    content = <ListSkeleton />;
  } else if (summary.isError || view.isError) {
    content = <ErrorState error={summary.error ?? view.error} onRetry={refresh} />;
  } else if (rows.length === 0 && onlySaved) {
    content = (
      <EmptyState
        emoji="⭐"
        title={g.emptySavedTitle}
        message={g.emptySavedMessage}
        actionLabel={g.showAllTopics}
        onAction={() => setOnlySaved(false)}
      />
    );
  } else if (rows.length === 0) {
    content = <EmptyState emoji="🧱" title={g.emptyTitle} message={g.emptyMessage} />;
  } else {
    content = null;
  }

  const renderRow = ({ item }: { item: Row }) => {
    switch (item.kind) {
      case 'category': {
        const { category } = item;
        const learned = learnedIn(category.lessons);
        const total = category.lessons.length;
        const status = category.testStatus;
        const done = total > 0 && learned === total;
        return (
          <View style={styles.pad}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: item.expanded }}
              onPress={() => setExpanded((e) => ({ ...e, [category.id]: !e[category.id] }))}
              style={({ pressed }) => [
                styles.category,
                item.expanded && { borderColor: GRAMMAR_COLOR },
                pressed && { opacity: 0.85 },
              ]}
            >
              <ProgressRing
                value={total > 0 ? (learned / total) * 100 : 0}
                size={56}
                stroke={6}
                textSize={12}
                color={done ? colors.success : GRAMMAR_COLOR}
                label={g.categoryRing(learned, total)}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText
                  variant="caption"
                  color={colors.mutedForeground}
                  style={{ fontWeight: '800' }}
                >
                  {g.topicN(item.index)}
                </AppText>
                <AppText variant="subheading">
                  {(persian && category.level !== 'B2' && category.titleFa) || category.title}
                </AppText>
                <AppText variant="small" color={colors.mutedForeground}>
                  {g.topicsLearned(learned, total)}
                </AppText>
                {status.completed ? (
                  <View style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                    <Badge tone="success" label={g.completed} />
                  </View>
                ) : status.passed ? (
                  <View style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                    <Badge tone="success" label={g.testPassed} />
                  </View>
                ) : null}
              </View>
              <DirectionalIcon
                name={item.expanded ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>
        );
      }
      case 'lesson': {
        const { lesson } = item;
        const text = localizedHeading(lesson, persian);
        const nodeColor = lesson.learned
          ? colors.success
          : item.next
            ? GRAMMAR_COLOR
            : colors.mutedForeground;
        return (
          <View style={[styles.pad, styles.lessonRow]}>
            {item.position > 0 ? (
              <View style={styles.rail}>
                <View
                  style={[
                    styles.node,
                    lesson.learned
                      ? { backgroundColor: colors.success, borderColor: colors.success }
                      : {
                          borderColor: nodeColor,
                          backgroundColor: item.next ? tint(GRAMMAR_COLOR, '1F') : colors.surface,
                        },
                  ]}
                >
                  {lesson.learned ? (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  ) : (
                    <AppText style={{ fontWeight: '800' }} color={nodeColor}>
                      {item.position}
                    </AppText>
                  )}
                </View>
                {!item.last ? (
                  <View
                    style={[
                      styles.line,
                      { backgroundColor: lesson.learned ? colors.success : colors.border },
                    ]}
                  />
                ) : null}
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => openLesson(lesson.id)}
              style={({ pressed }) => [
                styles.lessonCard,
                item.next && {
                  borderColor: GRAMMAR_COLOR,
                  backgroundColor: tint(GRAMMAR_COLOR, '14'),
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                {item.next ? (
                  <AppText variant="caption" color={GRAMMAR_DARK} style={{ fontWeight: '800' }}>
                    {g.upNext}
                  </AppText>
                ) : null}
                <AppText variant="subheading">{text.title}</AppText>
                {text.summary ? (
                  <AppText variant="small" color={colors.mutedForeground} numberOfLines={2}>
                    {text.summary}
                  </AppText>
                ) : null}
                <View style={styles.tags}>
                  {lesson.learned ? <Badge tone="success" label={g.learned} /> : null}
                  {lesson.quizCount > 0 ? (
                    <Badge label={g.questionCount(lesson.quizCount)} />
                  ) : null}
                </View>
              </View>
              {lesson.bookmarked ? (
                <Ionicons
                  name="star"
                  size={18}
                  color={colors.warning}
                  accessibilityLabel={g.saved}
                />
              ) : null}
              <DirectionalIcon name="chevron-forward" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        );
      }
      case 'test': {
        const status = item.category.testStatus;
        return (
          <View style={[styles.pad, { paddingVertical: spacing.sm }]}>
            <Button
              pill
              label={status.attempted ? g.retakeTest(status.score, status.total) : g.startTest}
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/grammar/category-test/[categoryId]',
                  params: { categoryId: item.category.id },
                })
              }
              color={GRAMMAR_DARK}
            />
          </View>
        );
      }
      case 'heading':
        return (
          <View style={styles.pad}>
            <AppText
              variant="heading"
              accessibilityRole="header"
              style={{ paddingTop: spacing.md }}
            >
              {item.title}
            </AppText>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={content ? [] : rows}
        keyExtractor={(row, i) =>
          row.kind === 'lesson'
            ? `l:${row.lesson.id}`
            : row.kind === 'category'
              ? `c:${row.category.id}`
              : row.kind === 'test'
                ? `t:${row.category.id}`
                : `h:${i}`
        }
        renderItem={renderRow}
        ListHeaderComponent={header}
        ListEmptyComponent={content ? <View style={styles.pad}>{content}</View> : null}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Gap}
        refreshControl={
          <RefreshControl refreshing={view.isRefetching && !view.isPending} onRefresh={refresh} />
        }
        initialNumToRender={12}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const Gap = () => <View style={{ height: spacing.sm }} />;

/** Level picker tile: big level, learned/total and a mini progress bar. */
function LevelTile({
  level,
  learned,
  total,
  selected,
  onPress,
}: {
  level: string;
  learned: number;
  total: number;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const percent = total > 0 ? (learned / total) * 100 : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${level} · ${learned}/${total}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.levelTile, selected && styles.levelTileOn]}
    >
      <AppText style={styles.levelText} color={selected ? '#FFFFFF' : colors.ink}>
        {level}
      </AppText>
      <AppText variant="caption" color={selected ? '#FFFFFFD9' : colors.mutedForeground}>
        {t.grammar.levelOf(learned, total)}
      </AppText>
      <View style={[styles.miniTrack, selected && { backgroundColor: '#FFFFFF55' }]}>
        <View
          style={[
            styles.miniFill,
            { width: `${percent}%`, backgroundColor: selected ? '#FFFFFF' : colors.success },
          ]}
        />
      </View>
    </Pressable>
  );
}

const NODE = 38;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  pad: { paddingHorizontal: spacing.lg },
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
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingTop: spacing.sm },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: colors.ink },
  levels: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  levelTile: {
    width: 104,
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  levelTileOn: { backgroundColor: GRAMMAR_COLOR, borderColor: GRAMMAR_COLOR },
  levelText: { fontSize: 24, lineHeight: 30, fontWeight: '800' },
  miniTrack: {
    height: 6,
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  miniFill: { height: '100%', borderRadius: radius.pill },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  filters: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  lessonRow: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: NODE },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { flex: 1, width: 3, borderRadius: 2, marginTop: 2, marginBottom: -spacing.sm },
  lessonCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
});
