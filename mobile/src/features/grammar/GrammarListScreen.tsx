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
  EmptyState,
  ErrorState,
  ProgressRing,
  Skeleton,
} from '@/components/ui';
import { IconButton, StatTile, tint } from '@/features/exam/components/kit';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, shadow, spacing } from '@/theme';
import type { GrammarCategorySummary, GrammarLessonSummary } from '@/types/grammar';
import { pickInitialLevel } from '@/utils/levels';
import { useLevelSummary, useLevelView } from './hooks';
import { localizedHeading } from './quiz';

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
    if (categories.length > 0) rows.push({ kind: 'heading', title: 'Weitere Themen' });
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
  return (
    <View accessibilityLabel="Grammatik wird geladen" style={{ gap: spacing.md }}>
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
      return buildRows(view.data?.categories ?? [], view.data?.uncategorized ?? [], expanded);
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
  }, [view.data, expanded, onlySaved]);

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
      <View style={[styles.hero, { backgroundColor: tint(colors.primary, '1F') }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topRow}>
            <IconButton name="arrow-back" label="Zurück" onPress={() => router.back()} />
            <View style={[styles.chip, { backgroundColor: tint(colors.primary, '33') }]}>
              <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
                📘 GRAMMATIK{level ? ` · ${level}` : ''}
              </AppText>
            </View>
          </View>
          <View style={styles.heroMain}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText style={styles.title} accessibilityRole="header">
                Grammatik
              </AppText>
              <AppText color={colors.ink} style={{ fontWeight: '500' }}>
                Wähle dein Niveau und ein Thema
              </AppText>
            </View>
            {current ? (
              <ProgressRing
                value={percent}
                size={84}
                stroke={9}
                color={colors.primary}
                textSize={20}
                trackColor="#FFFFFFCC"
                label={`Fortschritt ${level}`}
              />
            ) : null}
          </View>
        </SafeAreaView>
      </View>

      {summaries.length > 0 ? (
        <ScrollView
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
        </ScrollView>
      ) : null}

      {view.data ? (
        <View style={styles.pad}>
          <View style={styles.tiles}>
            <StatTile
              icon="checkmark-circle-outline"
              label="Erledigt"
              value={`${current?.learned ?? 0} / ${current?.total ?? 0}`}
              color={colors.success}
            />
            <StatTile
              icon="folder-open-outline"
              label="Themenblöcke"
              value={String(categoryCount)}
              color={colors.primary}
            />
            <StatTile
              icon="star-outline"
              label="Gemerkt"
              value={String(bookmarked)}
              color={colors.warning}
            />
          </View>
          <View style={styles.filters}>
            <Chip label="Alle Themen" selected={!onlySaved} onPress={() => setOnlySaved(false)} />
            <Chip
              label={`★ Gemerkt (${bookmarked})`}
              selected={onlySaved}
              onPress={() => setOnlySaved(true)}
            />
          </View>
          {nextLesson && !onlySaved ? (
            <View style={{ marginTop: spacing.md }}>
              <Button
                pill
                label={`${current?.learned ? 'Weiter' : 'Starten'}: ${localizedHeading(nextLesson, persian).title}`}
                onPress={() => openLesson(nextLesson.id)}
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
        title="Noch nichts gemerkt"
        message="Tippe in einer Lektion auf den Stern, um sie hier zu sammeln."
        actionLabel="Alle Themen anzeigen"
        onAction={() => setOnlySaved(false)}
      />
    );
  } else if (rows.length === 0) {
    content = (
      <EmptyState
        emoji="🧩"
        title="Noch keine Lektionen"
        message="Für dieses Niveau gibt es noch keine Lektionen. Schau später wieder vorbei oder wähle ein anderes Niveau."
      />
    );
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
                item.expanded && { borderColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <ProgressRing
                value={total > 0 ? (learned / total) * 100 : 0}
                size={56}
                stroke={6}
                textSize={12}
                color={done ? colors.success : colors.primary}
                label={`${learned} von ${total} gelernt`}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText
                  variant="caption"
                  color={colors.mutedForeground}
                  style={{ fontWeight: '800' }}
                >
                  THEMA {item.index}
                </AppText>
                <AppText variant="subheading">
                  {(persian && category.level !== 'B2' && category.titleFa) || category.title}
                </AppText>
                <AppText variant="small" color={colors.mutedForeground}>
                  {`${learned} von ${total} Themen gelernt`}
                </AppText>
                {status.completed ? (
                  <View style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                    <Badge tone="success" label="Abgeschlossen" />
                  </View>
                ) : status.passed ? (
                  <View style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                    <Badge tone="success" label="Test bestanden" />
                  </View>
                ) : null}
              </View>
              <Ionicons
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
            ? colors.primary
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
                          backgroundColor: item.next ? tint(colors.primary, '1F') : colors.surface,
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
                  borderColor: colors.primary,
                  backgroundColor: tint(colors.primary, '14'),
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                {item.next ? (
                  <AppText
                    variant="caption"
                    color={colors.primaryDark}
                    style={{ fontWeight: '800' }}
                  >
                    ALS NÄCHSTES
                  </AppText>
                ) : null}
                <AppText variant="subheading">{text.title}</AppText>
                {text.summary ? (
                  <AppText variant="small" color={colors.mutedForeground} numberOfLines={2}>
                    {text.summary}
                  </AppText>
                ) : null}
                <View style={styles.tags}>
                  {lesson.learned ? <Badge tone="success" label="Gelernt" /> : null}
                  {lesson.quizCount > 0 ? (
                    <Badge
                      label={`${lesson.quizCount} ${lesson.quizCount === 1 ? 'Frage' : 'Fragen'}`}
                    />
                  ) : null}
                </View>
              </View>
              {lesson.bookmarked ? (
                <Ionicons
                  name="star"
                  size={18}
                  color={colors.warning}
                  accessibilityLabel="Gemerkt"
                />
              ) : null}
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
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
              label={
                status.attempted
                  ? `Kategorie-Test wiederholen (zuletzt ${status.score}/${status.total})`
                  : 'Kategorie-Test starten'
              }
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/grammar/category-test/[categoryId]',
                  params: { categoryId: item.category.id },
                })
              }
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
        {`${learned} von ${total}`}
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
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: -spacing.sm,
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
  levelTileOn: { backgroundColor: colors.primary, borderColor: colors.primary },
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
