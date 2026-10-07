import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  Chip,
  DirectionalIcon,
  EmptyState,
  ErrorState,
  ProgressRing,
  Skeleton,
  TextField,
} from '@/components/ui';
import { PressableScale, tint } from '@/features/exam/components/kit';
import { useI18n } from '@/i18n';
import { HorizontalScroll } from '@/components/ui/HorizontalScroll';
import { colors, radius, shadow, spacing } from '@/theme';
import type { VocabularyItem, VocabularyMasteryLevel, VocabularySource } from '@/types/vocabulary';
import { CardsIllustration, MasteryBar, VocabularyHero } from './components/VocabularyViz';
import { WordCard } from './components/WordCard';
import { WordFormSheet } from './components/WordFormSheet';
import { useDeleteVocabulary, useToggleVocabularyBookmark, useVocabularyList } from './listHooks';
import {
  MASTERY_COLOR,
  MASTERY_ORDER,
  SOURCES,
  SOURCE_ICON,
  continueLearning,
  filterWords,
  masteryCounts,
  sourceCounts,
} from './listLogic';
import { VOCABULARY_COLOR, VOCABULARY_DARK } from './meta';

export function VocabularyScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const v = t.vocabulary;
  const list = useVocabularyList();
  const bookmark = useToggleVocabularyBookmark();
  const remove = useDeleteVocabulary();

  const [source, setSource] = useState<VocabularySource>('CUSTOM');
  const [search, setSearch] = useState('');
  const [mastery, setMastery] = useState<VocabularyMasteryLevel | 'ALL'>('ALL');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VocabularyItem | null>(null);

  const all = useMemo(() => list.data ?? [], [list.data]);
  const counts = useMemo(() => sourceCounts(all), [all]);
  const inSource = useMemo(() => all.filter((i) => i.source === source), [all, source]);
  const levels = useMemo(() => masteryCounts(inSource), [inSource]);
  const filtered = useMemo(
    () => filterWords(inSource, { search, mastery, bookmarkedOnly }),
    [inSource, search, mastery, bookmarkedOnly],
  );
  const next = useMemo(() => continueLearning(inSource), [inSource]);
  const isFiltered = search.trim() !== '' || mastery !== 'ALL' || bookmarkedOnly;
  const mastered = levels.MASTERED;
  const percent = inSource.length > 0 ? (mastered / inSource.length) * 100 : 0;

  const open = (item: VocabularyItem) =>
    router.push({ pathname: '/vocabulary/[itemId]', params: { itemId: item.id } });
  const practice = (item?: VocabularyItem) =>
    router.push(
      item ? { pathname: '/learn/review', params: { vocabularyItemId: item.id } } : '/learn/review',
    );
  const confirmDelete = (item: VocabularyItem) =>
    Alert.alert(v.deleteTitle, v.deleteMessage(item.word), [
      { text: v.cancel, style: 'cancel' },
      { text: v.delete, style: 'destructive', onPress: () => remove.mutate(item.id) },
    ]);
  const reset = () => {
    setSearch('');
    setMastery('ALL');
    setBookmarkedOnly(false);
  };

  const card = (item: VocabularyItem) => (
    <WordCard
      item={item}
      onOpen={() => open(item)}
      onPractice={() => practice(item)}
      onToggleBookmark={() => bookmark.mutate({ id: item.id, bookmarked: item.bookmarked })}
      onEdit={item.source !== 'DICTIONARY' ? () => setEditing(item) : undefined}
      onDelete={item.source !== 'DICTIONARY' ? () => confirmDelete(item) : undefined}
    />
  );

  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
      <VocabularyHero
        chip={v.chip(v.sources[source])}
        title={v.title}
        subtitle={v.subtitle}
        right={
          list.data && inSource.length > 0 ? (
            <ProgressRing
              value={percent}
              size={84}
              stroke={9}
              color={colors.success}
              textSize={20}
              trackColor="#FFFFFFCC"
              label={v.masteredWords}
            />
          ) : (
            <CardsIllustration size={104} />
          )
        }
      />

      <View style={[styles.pad, styles.ctaRow]}>
        <View style={{ flex: 1 }}>
          <Button
            pill
            label={v.addWord}
            onPress={() => setFormOpen(true)}
            color={VOCABULARY_COLOR}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            pill
            variant="secondary"
            label={v.startTraining}
            onPress={() => practice()}
            color={VOCABULARY_DARK}
          />
        </View>
      </View>

      <HorizontalScroll
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sources}
        style={{ flexGrow: 0 }}
      >
        {SOURCES.map((s) => {
          const on = s === source;
          return (
            <Pressable
              key={s}
              accessibilityRole="button"
              accessibilityLabel={v.sourceLabel(v.sources[s], counts[s])}
              accessibilityState={{ selected: on }}
              onPress={() => setSource(s)}
              style={[
                styles.source,
                on && { backgroundColor: VOCABULARY_COLOR, borderColor: VOCABULARY_COLOR },
              ]}
            >
              <Ionicons name={SOURCE_ICON[s]} size={18} color={on ? '#FFFFFF' : VOCABULARY_DARK} />
              <View>
                <AppText
                  variant="small"
                  color={on ? '#FFFFFF' : colors.ink}
                  style={{ fontWeight: '700' }}
                >
                  {v.sources[s]}
                </AppText>
                <AppText variant="caption" color={on ? '#FFFFFFD9' : colors.mutedForeground}>
                  {v.wordCount(counts[s])}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </HorizontalScroll>

      {inSource.length > 0 ? (
        <View style={[styles.pad, { gap: spacing.md }]}>
          <MasteryBar counts={levels} />
          <View style={styles.tiles}>
            {MASTERY_ORDER.map((m) => {
              const on = mastery === m;
              return (
                <Pressable
                  key={m}
                  accessibilityRole="button"
                  accessibilityLabel={v.masteryLabel(v.mastery[m], levels[m])}
                  accessibilityState={{ selected: on }}
                  onPress={() => setMastery(on ? 'ALL' : m)}
                  style={{ flex: 1 }}
                >
                  <View
                    style={[
                      styles.masteryTile,
                      { backgroundColor: tint(MASTERY_COLOR[m], '14') },
                      on && { borderColor: MASTERY_COLOR[m] },
                    ]}
                  >
                    <AppText style={[styles.masteryValue, { color: MASTERY_COLOR[m] }]}>
                      {levels[m]}
                    </AppText>
                    <AppText variant="caption" color={colors.mutedForeground} numberOfLines={1}>
                      {v.mastery[m]}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={[styles.pad, { gap: spacing.md }]}>
        <TextField
          label={v.search}
          placeholder={v.searchPlaceholder}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <View style={styles.filterRow}>
          <Chip
            label={v.onlyBookmarked}
            selected={bookmarkedOnly}
            onPress={() => setBookmarkedOnly((b) => !b)}
            color={VOCABULARY_DARK}
          />
          {isFiltered ? <Chip label={v.reset} onPress={reset} color={VOCABULARY_DARK} /> : null}
        </View>
      </View>

      {!isFiltered && next.list.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          <View style={styles.pad}>
            <AppText variant="heading">{v.keepLearning}</AppText>
            <AppText variant="small" color={colors.mutedForeground}>
              {v.waiting(next.readyCount)}
            </AppText>
          </View>
          <HorizontalScroll
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.minis}
            style={{ flexGrow: 0 }}
          >
            {next.list.map((item) => (
              <PressableScale
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={v.keepLearningWord(item.word)}
                onPress={() => practice(item)}
                style={[
                  styles.mini,
                  { borderTopColor: MASTERY_COLOR[item.progress?.masteryLevel ?? 'NEW'] },
                ]}
              >
                <AppText variant="subheading" numberOfLines={2}>
                  {item.article ? `${item.article} ${item.word}` : item.word}
                </AppText>
                <AppText variant="small" color={colors.mutedForeground} numberOfLines={2}>
                  {item.meaning}
                </AppText>
                <View style={styles.miniGo}>
                  <DirectionalIcon name="play" size={12} color={VOCABULARY_DARK} />
                  <AppText variant="caption" color={VOCABULARY_DARK} style={{ fontWeight: '800' }}>
                    {v.practiceShort}
                  </AppText>
                </View>
              </PressableScale>
            ))}
          </HorizontalScroll>
        </View>
      ) : null}

      {inSource.length > 0 ? (
        <View style={[styles.pad, styles.allRow]}>
          <AppText variant="heading">{v.allWords}</AppText>
          <View style={styles.count}>
            <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '700' }}>
              {filtered.length}
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  );

  let empty = null;
  if (list.isPending) {
    empty = (
      <View accessibilityLabel={v.loading} style={{ gap: spacing.md }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={170} />
        ))}
      </View>
    );
  } else if (list.isError) {
    empty = <ErrorState error={list.error} onRetry={() => void list.refetch()} />;
  } else if (filtered.length === 0) {
    empty = isFiltered ? (
      <EmptyState
        emoji="🔍"
        title={v.noMatchesTitle}
        message={v.noMatchesMessage}
        actionLabel={v.resetFilters}
        onAction={reset}
      />
    ) : source === 'CUSTOM' ? (
      <EmptyState
        emoji="📚"
        title={v.emptyTitle}
        message={v.emptyMessage}
        actionLabel={v.addWord}
        onAction={() => setFormOpen(true)}
      />
    ) : (
      <EmptyState
        emoji={source === 'DICTIONARY' ? '📖' : '✨'}
        title={v.emptySavedTitle}
        message={source === 'DICTIONARY' ? v.emptyDictionary : v.emptyTutor}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        testID="vocabulary-list"
        data={empty ? [] : filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <View style={styles.pad}>{card(item)}</View>}
        ItemSeparatorComponent={Gap}
        ListHeaderComponent={header}
        ListEmptyComponent={empty ? <View style={styles.pad}>{empty}</View> : null}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching && !list.isPending}
            onRefresh={() => void list.refetch()}
          />
        }
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />

      <WordFormSheet
        visible={formOpen || !!editing}
        item={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={(saved) => {
          if (!editing) setSource(saved.source);
        }}
      />
    </SafeAreaView>
  );
}

const Gap = () => <View style={{ height: spacing.md }} />;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  pad: { paddingHorizontal: spacing.lg },
  ctaRow: { flexDirection: 'row', gap: spacing.md },
  sources: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  masteryTile: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  masteryValue: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  filterRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  minis: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  mini: {
    width: 170,
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderTopWidth: 4,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  miniGo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  allRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  count: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
  },
});
