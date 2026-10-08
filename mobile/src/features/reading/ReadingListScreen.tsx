import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  Chip,
  EmptyState,
  ErrorState,
  ProgressRing,
  Skeleton,
  TextField,
} from '@/components/ui';
import { PressableScale, StatTile, tint } from '@/features/exam/components/kit';
import { HorizontalScroll } from '@/components/ui/HorizontalScroll';
import { useI18n } from '@/i18n';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, shadow, spacing } from '@/theme';
import type { ReadingArticleSummary } from '@/types/reading';
import { ReadingDownloadBar } from './ReadingDownloadBar';
import { pickInitialLevel } from '@/utils/levels';
import { resolveUploadUrl } from '@/utils/urls';
import { BookIllustration, InfoPill, READING_COLOR, ReadingHero } from './components/ReadingViz';
import {
  useReadingCategories,
  useReadingLevelSummary,
  useReadingList,
  useToggleArticleBookmark,
} from './hooks';
import { READING_DARK } from './components/ReadingViz';

function ArticleCard({
  item,
  next,
  onPress,
}: {
  item: ReadingArticleSummary;
  next: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const r = t.reading;
  const image = resolveUploadUrl(item.thumbnailUrl ?? item.imageUrl);
  const bookmark = useToggleArticleBookmark(item.id);
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={r.cardLabel(item.title, item.learned)}
      onPress={onPress}
      style={[styles.card, next && { borderColor: READING_COLOR, borderWidth: 2 }]}
    >
      <View style={styles.cover}>
        {image ? (
          <Image source={{ uri: image }} contentFit="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.coverEmpty]}>
            <AppText style={{ fontSize: 40, lineHeight: 48 }}>📖</AppText>
          </View>
        )}
        <View style={styles.coverTop}>
          <View style={styles.levelPill}>
            <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '800' }}>
              {item.level}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.bookmarked ? r.saved : r.save}
            disabled={bookmark.isPending}
            onPress={() => bookmark.mutate(item.bookmarked)}
            hitSlop={spacing.sm}
            style={styles.starBtn}
          >
            <Ionicons
              name={item.bookmarked ? 'star' : 'star-outline'}
              size={20}
              color={item.bookmarked ? colors.warning : colors.ink}
            />
          </Pressable>
        </View>
        {item.learned ? (
          <View style={styles.readBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '800' }}>
              {r.readBadge}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        {next ? (
          <AppText variant="caption" color={READING_COLOR} style={{ fontWeight: '800' }}>
            {r.upNext}
          </AppText>
        ) : null}
        <AppText variant="subheading" numberOfLines={2}>
          {item.title}
        </AppText>
        <View style={styles.tags}>
          {item.categoryTitle ? (
            <InfoPill
              icon="pricetag-outline"
              text={item.categoryTitle}
              color={colors.mutedForeground}
              background={colors.muted}
            />
          ) : null}
          {item.newWordCount > 0 ? (
            <InfoPill
              icon="sparkles"
              text={r.newWords(item.newWordCount)}
              color="#8A5A00"
              background={colors.warningSoft}
            />
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

export function ReadingListScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const r = t.reading;
  const profileLevel = useAuthStore((s) => s.profile?.learningLevel);
  const summary = useReadingLevelSummary();
  const categories = useReadingCategories();
  const [pickedLevel, setPickedLevel] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);

  const summaries = useMemo(() => summary.data ?? [], [summary.data]);
  const level = pickedLevel ?? pickInitialLevel(profileLevel, summaries);
  const params = level ? { level, search: debounced, bookmarked, categoryId } : null;
  const list = useReadingList(params);
  const items = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data]);
  const totalMatches = list.data?.pages[0]?.totalElements ?? 0;
  const filtered = !!categoryId || bookmarked || debounced !== '';
  const nextId = !filtered ? items.find((a) => !a.learned)?.id : undefined;

  const current = summaries.find((s) => s.level === level);
  const percent = current && current.total > 0 ? (current.learned / current.total) * 100 : 0;

  const reset = () => {
    setSearch('');
    setCategoryId('');
    setBookmarked(false);
  };

  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
      <ReadingHero
        chip={r.chip(level ?? undefined)}
        title={r.title}
        subtitle={r.subtitle}
        right={
          current ? (
            <ProgressRing
              value={percent}
              size={84}
              stroke={9}
              color={READING_COLOR}
              textSize={20}
              trackColor="#FFFFFFCC"
              label={r.progressLabel(level ?? '')}
            />
          ) : (
            <BookIllustration size={104} />
          )
        }
      />

      {summaries.length > 0 ? (
        <HorizontalScroll
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levels}
          style={{ flexGrow: 0 }}
        >
          {summaries.map((s) => {
            const on = s.level === level;
            const p = s.total > 0 ? (s.learned / s.total) * 100 : 0;
            return (
              <Pressable
                key={s.level}
                accessibilityRole="button"
                accessibilityLabel={`${s.level} · ${s.learned}/${s.total}`}
                accessibilityState={{ selected: on }}
                onPress={() => setPickedLevel(s.level)}
                style={[
                  styles.levelTile,
                  on && { backgroundColor: READING_COLOR, borderColor: READING_COLOR },
                ]}
              >
                <AppText style={styles.levelText} color={on ? '#FFFFFF' : colors.ink}>
                  {s.level}
                </AppText>
                <AppText variant="caption" color={on ? '#FFFFFFD9' : colors.mutedForeground}>
                  {r.levelCount(s.learned, s.total)}
                </AppText>
                <View style={[styles.miniTrack, on && { backgroundColor: '#FFFFFF55' }]}>
                  <View
                    style={[
                      styles.miniFill,
                      { width: `${p}%`, backgroundColor: on ? '#FFFFFF' : colors.success },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
        </HorizontalScroll>
      ) : null}

      {current ? (
        <View style={[styles.pad, styles.tiles]}>
          <StatTile
            icon="checkmark-circle-outline"
            label={r.tileRead}
            value={`${current.learned} / ${current.total}`}
            color={colors.success}
          />
          <StatTile
            icon="book-outline"
            label={r.tileOpen}
            value={String(Math.max(0, current.total - current.learned))}
            color={READING_COLOR}
          />
          <StatTile
            icon="pricetags-outline"
            label={r.tileTopics}
            value={String(categories.data?.length ?? 0)}
            color={colors.primary}
          />
        </View>
      ) : null}

      <View style={[styles.pad, { gap: spacing.md }]}>
        <TextField
          label={r.search}
          placeholder={r.searchPlaceholder}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <HorizontalScroll
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsBleed}
        >
          <Chip
            label={r.savedFilter}
            selected={bookmarked}
            onPress={() => setBookmarked((b) => !b)}
            color={READING_DARK}
          />
          <Chip
            label={r.allTopics}
            selected={categoryId === ''}
            onPress={() => setCategoryId('')}
            color={READING_DARK}
          />
          {(categories.data ?? []).map((c) => (
            <Chip
              key={c.id}
              label={c.title}
              selected={categoryId === c.id}
              onPress={() => setCategoryId(c.id)}
              color={READING_DARK}
            />
          ))}
        </HorizontalScroll>
        {params && (categoryId || bookmarked) && debounced === '' && totalMatches > 0 ? (
          <ReadingDownloadBar params={params} total={totalMatches} />
        ) : null}
      </View>
    </View>
  );

  let empty = null;
  if (summary.isPending || (list.isPending && !!params)) {
    empty = (
      <View accessibilityLabel={r.loading} style={{ gap: spacing.md }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={200} />
        ))}
      </View>
    );
  } else if (summary.isError || list.isError) {
    empty = (
      <ErrorState
        error={summary.error ?? list.error}
        onRetry={() => {
          void summary.refetch();
          void list.refetch();
        }}
      />
    );
  } else if (items.length === 0) {
    empty = filtered ? (
      <EmptyState
        emoji="🔍"
        title={r.noneTitle}
        message={r.noneMessage}
        actionLabel={r.resetFilter}
        onAction={reset}
      />
    ) : (
      <EmptyState emoji="📖" title={r.emptyTitle} message={r.emptyMessage} />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        testID="reading-list"
        data={empty ? [] : items}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View style={styles.pad}>
            <ArticleCard
              item={item}
              next={item.id === nextId}
              onPress={() =>
                router.push({ pathname: '/reading/[articleId]', params: { articleId: item.id } })
              }
            />
          </View>
        )}
        ItemSeparatorComponent={Gap}
        ListHeaderComponent={header}
        ListEmptyComponent={empty ? <View style={styles.pad}>{empty}</View> : null}
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <View style={{ padding: spacing.lg }} accessibilityLabel={r.loadingMore}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching && !list.isFetchingNextPage && !list.isPending}
            onRefresh={() => void list.refetch()}
          />
        }
        contentContainerStyle={styles.list}
        initialNumToRender={10}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const Gap = () => <View style={{ height: spacing.lg }} />;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  pad: { paddingHorizontal: spacing.lg },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  chipsBleed: { marginHorizontal: -spacing.lg },
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
  levelText: { fontSize: 24, lineHeight: 30, fontWeight: '800' },
  miniTrack: {
    height: 6,
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  miniFill: { height: '100%', borderRadius: radius.pill },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow.card,
  },
  cover: { height: 150, backgroundColor: tint(READING_COLOR, '1F') },
  coverEmpty: { alignItems: 'center', justifyContent: 'center' },
  coverTop: {
    position: 'absolute',
    top: spacing.sm,
    start: spacing.sm,
    end: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: READING_COLOR,
  },
  starBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFFE6',
  },
  readBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    start: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  cardBody: { gap: spacing.xs, padding: spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
});
