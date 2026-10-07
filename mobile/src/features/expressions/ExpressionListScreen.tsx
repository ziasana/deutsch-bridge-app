import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
  EmptyState,
  ErrorState,
  Skeleton,
  TextField,
} from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { colors, spacing } from '@/theme';
import type { ExpressionFilters, ExpressionSort, ExpressionType } from '@/types/expression';
import { ExpressionHero } from './components/ExpressionViz';
import { ExpressionRow } from './components/ExpressionRow';
import { useExpressionList } from './hooks';
import {
  LEVELS,
  MASTERY_LABEL,
  MASTERY_ORDER,
  SORT_LABEL,
  TYPE_COLOR,
  TYPE_DESCRIPTION,
  TYPE_EMOJI,
  TYPE_LABEL,
  EXPRESSION_COLOR,
} from './labels';
import { EXPRESSION_DARK } from './labels';

const DEFAULT_FILTERS: Omit<ExpressionFilters, 'search'> = {
  level: 'ALL',
  progress: 'ALL',
  bookmarked: false,
  sort: 'recommended',
};

export const activeFilterCount = (f: Omit<ExpressionFilters, 'search'>) =>
  (f.level !== 'ALL' ? 1 : 0) +
  (f.progress !== 'ALL' ? 1 : 0) +
  (f.bookmarked ? 1 : 0) +
  (f.sort !== 'recommended' ? 1 : 0);

const isType = (v: string | undefined): v is ExpressionType =>
  v === 'REDEWENDUNG' || v === 'NOMEN_VERB_VERBINDUNG';

export function ExpressionListScreen() {
  const router = useRouter();
  const { type: rawType } = useLocalSearchParams<{ type: string }>();
  const type: ExpressionType = isType(rawType) ? rawType : 'REDEWENDUNG';

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const query = useExpressionList(type, { ...filters, search: debouncedSearch });
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.totalElements;
  const filtered = activeFilterCount(filters) > 0 || debouncedSearch !== '';
  const set = <K extends keyof typeof DEFAULT_FILTERS>(
    key: K,
    value: (typeof DEFAULT_FILTERS)[K],
  ) => setFilters((f) => ({ ...f, [key]: value }));
  const reset = () => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
  };

  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
      <ExpressionHero
        accent={TYPE_COLOR[type]}
        chip={`${TYPE_EMOJI[type]} ${total !== undefined ? `${total} TREFFER` : 'SAMMLUNG'}`}
        title={TYPE_LABEL[type]}
        subtitle={TYPE_DESCRIPTION[type]}
      />
      <View style={[styles.pad, { gap: spacing.md }]}>
        <TextField
          label="Suchen"
          placeholder="Wendung suchen …"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <Button
          pill
          variant="secondary"
          label={`Filter & Sortierung${activeFilterCount(filters) > 0 ? ` (${activeFilterCount(filters)})` : ''} ${showFilters ? '▴' : '▾'}`}
          onPress={() => setShowFilters((s) => !s)}
          color={EXPRESSION_DARK}
        />
      </View>
      {showFilters ? (
        <View style={[styles.pad, { gap: spacing.md }]}>
          <ChipRow label="Niveau">
            <Chip
              label="Alle"
              selected={filters.level === 'ALL'}
              onPress={() => set('level', 'ALL')}
              color={EXPRESSION_DARK}
            />
            {LEVELS.map((l) => (
              <Chip
                key={l}
                label={l}
                selected={filters.level === l}
                onPress={() => set('level', l)}
                color={EXPRESSION_DARK}
              />
            ))}
          </ChipRow>
          <ChipRow label="Fortschritt">
            <Chip
              label="Alle"
              selected={filters.progress === 'ALL'}
              onPress={() => set('progress', 'ALL')}
              color={EXPRESSION_DARK}
            />
            {MASTERY_ORDER.map((m) => (
              <Chip
                key={m}
                label={MASTERY_LABEL[m]}
                selected={filters.progress === m}
                onPress={() => set('progress', m)}
                color={EXPRESSION_DARK}
              />
            ))}
          </ChipRow>
          <ChipRow label="Sortierung">
            {(Object.keys(SORT_LABEL) as ExpressionSort[]).map((s) => (
              <Chip
                key={s}
                label={SORT_LABEL[s]}
                selected={filters.sort === s}
                onPress={() => set('sort', s)}
                color={EXPRESSION_DARK}
              />
            ))}
            <Chip
              label="★ Nur Gemerkte"
              selected={filters.bookmarked}
              onPress={() => set('bookmarked', !filters.bookmarked)}
              color={EXPRESSION_DARK}
            />
          </ChipRow>
          {filtered ? (
            <Button label="Zurücksetzen" variant="ghost" onPress={reset} color={EXPRESSION_DARK} />
          ) : null}
        </View>
      ) : null}
    </View>
  );

  let empty = null;
  if (query.isPending) {
    empty = (
      <View accessibilityLabel="Wendungen werden geladen" style={{ gap: spacing.md }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={56} />
        ))}
      </View>
    );
  } else if (query.isError) {
    empty = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else if (items.length === 0) {
    empty = filtered ? (
      <EmptyState
        emoji="🔍"
        title="Keine Treffer"
        message="Passe die Suche oder die Filter an."
        actionLabel="Filter zurücksetzen"
        onAction={reset}
      />
    ) : (
      <EmptyState
        emoji="💬"
        title="Noch keine Einträge"
        message="In dieser Sammlung gibt es noch keine Wendungen."
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        testID="expression-list"
        data={empty ? [] : items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.pad}>
            <ExpressionRow
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/expressions/[expressionId]',
                  params: { expressionId: item.id },
                })
              }
            />
          </View>
        )}
        ItemSeparatorComponent={Gap}
        ListHeaderComponent={header}
        ListEmptyComponent={empty ? <View style={styles.pad}>{empty}</View> : null}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View
              style={{ padding: spacing.lg }}
              accessibilityLabel="Weitere Wendungen werden geladen"
            >
              <ActivityIndicator color={EXPRESSION_COLOR} />
            </View>
          ) : query.hasNextPage ? null : items.length > 0 ? (
            <AppText
              variant="small"
              color={colors.mutedForeground}
              center
              style={{ padding: spacing.lg }}
            >
              Das waren alle Einträge.
            </AppText>
          ) : null
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage && !query.isPending}
            onRefresh={() => void query.refetch()}
          />
        }
        contentContainerStyle={styles.list}
        initialNumToRender={12}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const Gap = () => <View style={{ height: spacing.sm }} />;

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" color={colors.mutedForeground}>
        {label.toUpperCase()}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  pad: { paddingHorizontal: spacing.lg },
});
