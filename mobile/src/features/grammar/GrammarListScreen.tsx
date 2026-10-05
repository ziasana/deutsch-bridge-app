import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Header,
  ListItem,
  Skeleton,
} from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/theme';
import type {
  GrammarCategorySummary,
  GrammarLessonSummary,
  GrammarLevelSummary,
} from '@/types/grammar';
import { useLevelSummary, useLevelView } from './hooks';
import { localizedHeading } from './quiz';

type Row =
  | { kind: 'category'; category: GrammarCategorySummary; expanded: boolean }
  | { kind: 'lesson'; lesson: GrammarLessonSummary }
  | { kind: 'test'; category: GrammarCategorySummary }
  | { kind: 'heading'; title: string };

/** Flattens categories (+ their lessons when expanded) and uncategorized lessons into one virtualized list. */
export function buildRows(
  categories: GrammarCategorySummary[],
  uncategorized: GrammarLessonSummary[],
  expanded: Record<string, boolean>,
): Row[] {
  const rows: Row[] = [];
  for (const category of categories) {
    const open = !!expanded[category.id];
    rows.push({ kind: 'category', category, expanded: open });
    if (open) {
      for (const lesson of category.lessons) rows.push({ kind: 'lesson', lesson });
      if (category.lessons.some((l) => l.quizCount > 0)) rows.push({ kind: 'test', category });
    }
  }
  if (uncategorized.length > 0) {
    if (categories.length > 0) rows.push({ kind: 'heading', title: 'Weitere Themen' });
    for (const lesson of uncategorized) rows.push({ kind: 'lesson', lesson });
  }
  return rows;
}

export const learnedIn = (lessons: GrammarLessonSummary[]) =>
  lessons.filter((l) => l.learned).length;

/** The level to show first: the learner's own level when available, else the first with content. */
export function pickInitialLevel(
  profileLevel: string | null | undefined,
  summaries: GrammarLevelSummary[],
): string | null {
  const valid = profileLevel && profileLevel !== 'null' ? profileLevel : null;
  if (valid && summaries.some((s) => s.level === valid)) return valid;
  return summaries.find((s) => s.total > 0)?.level ?? summaries[0]?.level ?? valid;
}

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

  const summaries = useMemo(() => summary.data ?? [], [summary.data]);
  const level = picked ?? pickInitialLevel(profileLevel, summaries);
  const view = useLevelView(level);

  const rows = useMemo(
    () => buildRows(view.data?.categories ?? [], view.data?.uncategorized ?? [], expanded),
    [view.data, expanded],
  );

  const refresh = () => {
    void summary.refetch();
    void view.refetch();
  };

  const header = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
      <Header title="Grammar" subtitle="Wähle dein Niveau und ein Thema" back />
      {summaries.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {summaries.map((s) => (
            <Chip
              key={s.level}
              label={`${s.level} · ${s.learned}/${s.total}`}
              selected={s.level === level}
              onPress={() => setPicked(s.level)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  let content;
  if (summary.isPending || (view.isPending && !!level)) {
    content = <ListSkeleton />;
  } else if (summary.isError || view.isError) {
    content = <ErrorState error={summary.error ?? view.error} onRetry={refresh} />;
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
        const status = category.testStatus;
        return (
          <Card style={styles.categoryCard}>
            <ListItem
              title={(persian && category.level !== 'B2' && category.titleFa) || category.title}
              subtitle={`${learned} von ${category.lessons.length} Themen gelernt`}
              leading={<AppText style={{ fontSize: 22 }}>{item.expanded ? '📂' : '📁'}</AppText>}
              trailing={
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  {status.completed ? (
                    <Badge tone="success" label="Abgeschlossen" />
                  ) : status.passed ? (
                    <Badge tone="success" label="Test bestanden" />
                  ) : null}
                  <AppText>{item.expanded ? '▾' : '›'}</AppText>
                </View>
              }
              onPress={() => setExpanded((e) => ({ ...e, [category.id]: !e[category.id] }))}
            />
          </Card>
        );
      }
      case 'lesson': {
        const { lesson } = item;
        const text = localizedHeading(lesson, persian);
        return (
          <ListItem
            title={text.title}
            subtitle={text.summary}
            leading={<AppText style={styles.mark}>{lesson.learned ? '✓' : '○'}</AppText>}
            trailing={
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                {lesson.learned ? <Badge tone="success" label="Gelernt" /> : null}
                {lesson.bookmarked ? <AppText accessibilityLabel="Gemerkt">★</AppText> : null}
              </View>
            }
            onPress={() =>
              router.push({ pathname: '/grammar/[lessonId]', params: { lessonId: lesson.id } })
            }
          />
        );
      }
      case 'test': {
        const status = item.category.testStatus;
        return (
          <View style={{ paddingVertical: spacing.sm }}>
            <Button
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
          <AppText variant="heading" accessibilityRole="header" style={{ paddingTop: spacing.md }}>
            {item.title}
          </AppText>
        );
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
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
        ListEmptyComponent={content}
        contentContainerStyle={styles.list}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  categoryCard: { paddingVertical: spacing.xs, marginTop: spacing.sm },
  mark: { fontSize: 20, width: 28, textAlign: 'center' },
});
