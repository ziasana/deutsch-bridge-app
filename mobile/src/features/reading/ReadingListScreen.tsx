import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Badge, Chip, EmptyState, ErrorState, Header, ListItem, Skeleton, TextField } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import type { ReadingArticleSummary } from '@/types/reading';
import { resolveUploadUrl } from '@/utils/urls';
import { pickInitialLevel } from '@/utils/levels';
import { useReadingCategories, useReadingLevelSummary, useReadingList } from './hooks';

function ArticleRow({ item, onPress }: { item: ReadingArticleSummary; onPress: () => void }) {
  const image = resolveUploadUrl(item.thumbnailUrl ?? item.imageUrl);
  return (
    <ListItem
      title={item.title}
      subtitle={[item.categoryTitle, item.newWordCount > 0 ? `${item.newWordCount} neue Wörter` : null].filter(Boolean).join(' · ')}
      leading={image ? <Image source={{ uri: image }} contentFit="cover" style={styles.thumb} /> : undefined}
      trailing={
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Badge tone="primary" label={item.level} />
          {item.learned ? <Badge tone="success" label="✓ Gelesen" /> : null}
          {item.bookmarked ? (
            <AppText accessibilityLabel="Gemerkt" color={colors.warning}>
              ★
            </AppText>
          ) : null}
        </View>
      }
      onPress={onPress}
    />
  );
}

export function ReadingListScreen() {
  const router = useRouter();
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
  const filtered = !!categoryId || bookmarked || debounced !== '';

  const reset = () => {
    setSearch('');
    setCategoryId('');
    setBookmarked(false);
  };

  const header = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
      <Header title="Reading" subtitle="Lies Texte auf deinem Niveau" back />
      {summaries.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {summaries.map((s) => (
            <Chip key={s.level} label={`${s.level} · ${s.learned}/${s.total}`} selected={s.level === level} onPress={() => setPickedLevel(s.level)} />
          ))}
        </ScrollView>
      ) : null}
      <TextField label="Suchen" value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false} returnKeyType="search" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="★ Gemerkte" selected={bookmarked} onPress={() => setBookmarked((b) => !b)} />
        <Chip label="Alle Themen" selected={categoryId === ''} onPress={() => setCategoryId('')} />
        {(categories.data ?? []).map((c) => (
          <Chip key={c.id} label={c.title} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
        ))}
      </ScrollView>
    </View>
  );

  let empty = null;
  if (summary.isPending || (list.isPending && !!params)) {
    empty = (
      <View accessibilityLabel="Texte werden geladen" style={{ gap: spacing.md }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={56} />
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
      <EmptyState emoji="🔍" title="Keine Texte gefunden" message="Passe Suche oder Filter an." actionLabel="Filter zurücksetzen" onAction={reset} />
    ) : (
      <EmptyState emoji="📖" title="Noch keine Texte" message="Für dieses Niveau gibt es noch keine Texte. Wähle ein anderes Niveau." />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <FlatList
        testID="reading-list"
        data={empty ? [] : items}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <ArticleRow item={item} onPress={() => router.push({ pathname: '/reading/[articleId]', params: { articleId: item.id } })} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <View style={{ padding: spacing.lg }} accessibilityLabel="Weitere Texte werden geladen">
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.muted },
});
