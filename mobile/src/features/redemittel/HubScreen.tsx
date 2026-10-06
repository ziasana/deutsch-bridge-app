import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  Chip,
  EmptyState,
  ErrorState,
  ProgressRing,
  Skeleton,
  TextField,
} from '@/components/ui';
import { PressableScale, tint } from '@/features/exam/components/kit';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Redemittel, RedemittelStatus } from '@/types/redemittel';
import { RedemittelRow } from './components/RedemittelRow';
import { PhraseIllustration, RedemittelHero } from './components/RedemittelViz';
import { useRedemittelHub, useRedemittelList, useTodayPreview, useToggleSave } from './hooks';
import {
  LEVELS,
  REDEMITTEL_COLOR,
  STATUS_COLOR,
  STATUS_LABELS,
  categoryEmoji,
  recommendedStep,
  type NextStep,
} from './meta';

const STATUSES: RedemittelStatus[] = ['NEW', 'LEARNING', 'REVIEW', 'MASTERED'];

function Step({
  emoji,
  color,
  label,
  hint,
  recommended,
  disabled,
  onPress,
}: {
  emoji: string;
  color: string;
  label: string;
  hint: string;
  recommended: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.step,
        recommended && {
          borderColor: REDEMITTEL_COLOR,
          borderWidth: 2,
          backgroundColor: tint(REDEMITTEL_COLOR, '14'),
        },
        disabled && { opacity: 0.55 },
      ]}
    >
      <View style={[styles.stepIcon, { backgroundColor: tint(color, '1F') }]}>
        <AppText style={{ fontSize: 22, lineHeight: 28 }}>
          {disabled && label !== 'Üben' ? '✓' : emoji}
        </AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="subheading">{label}</AppText>
        <AppText variant="small" color={colors.mutedForeground} numberOfLines={1}>
          {hint}
        </AppText>
      </View>
      {recommended ? (
        <View style={styles.next}>
          <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '800' }}>
            Als Nächstes
          </AppText>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
      )}
    </PressableScale>
  );
}

export function RedemittelHubScreen() {
  const router = useRouter();
  const hub = useRedemittelHub();
  const toggle = useToggleSave();

  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState<RedemittelStatus | 'ALL'>('ALL');
  const [savedOnly, setSavedOnly] = useState(false);
  const debounced = useDebouncedValue(search.trim(), 300);

  const list = useRedemittelList({
    level: level === 'ALL' ? undefined : level,
    category: category === 'ALL' ? undefined : category,
    search: debounced || undefined,
    status: status === 'ALL' ? undefined : status,
    saved: savedOnly || undefined,
  });
  const items = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data]);
  const filtered =
    level !== 'ALL' || category !== 'ALL' || status !== 'ALL' || savedOnly || debounced !== '';

  const h = hub.data;
  const today = useTodayPreview(!!h && h.newToday > 0);
  const next: NextStep = h ? recommendedStep(h) : null;
  const canPractice = !!h && h.summary.learned + h.savedCount > 0;

  const open = (r: Redemittel) =>
    router.push({ pathname: '/redemittel/[id]', params: { id: r.id } });
  const reset = () => {
    setSearch('');
    setLevel('ALL');
    setCategory('ALL');
    setStatus('ALL');
    setSavedOnly(false);
  };
  const refresh = () => {
    void hub.refetch();
    void list.refetch();
  };
  const goal = h ? Math.min(h.learnedToday, h.dailyTarget) : 0;

  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
      <RedemittelHero
        chip="🗣️ REDEMITTEL"
        title="Redemittel"
        subtitle="Ausdrücke für Schreiben, Sprechen und Alltag."
        right={
          h ? (
            <ProgressRing
              value={h.dailyTarget > 0 ? (goal / h.dailyTarget) * 100 : 0}
              size={84}
              stroke={9}
              color={REDEMITTEL_COLOR}
              textSize={18}
              trackColor="#FFFFFFCC"
              label={`Tagesziel: ${goal} von ${h.dailyTarget} neuen Redemitteln gelernt`}
            />
          ) : (
            <PhraseIllustration size={100} />
          )
        }
      />

      {h ? (
        <View style={[styles.pad, { gap: spacing.md }]}>
          <View
            accessible
            accessibilityLabel={`Sicher ${h.summary.mastered}, Wiederholen ${h.summary.review}, Lernen ${h.summary.learning}, Neu ${h.summary.fresh}`}
            style={styles.bar}
          >
            {(['MASTERED', 'REVIEW', 'LEARNING', 'NEW'] as RedemittelStatus[]).map((s) => {
              const count =
                s === 'NEW'
                  ? h.summary.fresh
                  : s === 'MASTERED'
                    ? h.summary.mastered
                    : s === 'REVIEW'
                      ? h.summary.review
                      : h.summary.learning;
              return count > 0 ? (
                <View key={s} style={{ flex: count, backgroundColor: STATUS_COLOR[s] }} />
              ) : null;
            })}
          </View>
          <View style={styles.tiles}>
            {STATUSES.map((s) => {
              const count =
                s === 'NEW'
                  ? h.summary.fresh
                  : s === 'MASTERED'
                    ? h.summary.mastered
                    : s === 'REVIEW'
                      ? h.summary.review
                      : h.summary.learning;
              const on = status === s;
              return (
                <Pressable
                  key={s}
                  accessibilityRole="button"
                  accessibilityLabel={`${STATUS_LABELS[s]}: ${count}`}
                  accessibilityState={{ selected: on }}
                  onPress={() => setStatus(on ? 'ALL' : s)}
                  style={{ flex: 1 }}
                >
                  <View
                    style={[
                      styles.statusTile,
                      { backgroundColor: tint(STATUS_COLOR[s], '14') },
                      on && { borderColor: STATUS_COLOR[s] },
                    ]}
                  >
                    <AppText style={[styles.statusValue, { color: STATUS_COLOR[s] }]}>
                      {count}
                    </AppText>
                    <AppText variant="caption" color={colors.mutedForeground} numberOfLines={1}>
                      {STATUS_LABELS[s]}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={[styles.pad, { gap: spacing.md }]}>
        <View>
          <AppText style={styles.sectionTitle} accessibilityRole="header">
            Heute für dich
          </AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            {h && h.dueCount === 0 && h.newToday === 0
              ? 'Alles erledigt für heute – gut gemacht!'
              : 'Ein Schritt nach dem anderen, in deinem Tempo.'}
          </AppText>
        </View>
        <Step
          emoji="🔄"
          color="#4D94FF"
          label="Wiederholen"
          hint={h && h.dueCount > 0 ? `${h.dueCount} Redemittel auffrischen` : 'Nichts offen'}
          recommended={next === 'review'}
          disabled={!h || h.dueCount === 0}
          onPress={() => router.push('/redemittel/review')}
        />
        <Step
          emoji="🌱"
          color="#E8892B"
          label="Lernen"
          hint={
            h && h.newToday > 0
              ? h.newToday === 1
                ? '1 neues Redemittel'
                : `${h.newToday} neue Redemittel`
              : 'Heute alles gelernt'
          }
          recommended={next === 'learn'}
          disabled={!h || h.newToday === 0}
          onPress={() => router.push('/redemittel/learn')}
        />
        <Step
          emoji="💪"
          color="#27AE7A"
          label="Üben"
          hint={canPractice ? 'Frei üben, ohne Druck' : 'Lerne zuerst ein Redemittel'}
          recommended={next === 'practice'}
          disabled={!canPractice}
          onPress={() => router.push('/redemittel/practice')}
        />
        {today.data && today.data.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '800' }}>
              HEUTE NEU
            </AppText>
            <View style={styles.chipsWrap}>
              {today.data.slice(0, 3).map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  accessibilityLabel={r.phrase}
                  onPress={() => open(r)}
                  style={styles.phraseChip}
                >
                  <AppText
                    variant="small"
                    style={{ fontWeight: '700' }}
                    color={colors.ink}
                    numberOfLines={1}
                  >
                    {r.phrase}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.pad, { gap: spacing.md }]}>
        <AppText style={styles.sectionTitle} accessibilityRole="header">
          Entdecken
        </AppText>
        <TextField
          label="Suchen"
          placeholder="Redemittel suchen …"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.bleed}
        >
          <Chip
            label={`★ Meine Sammlung${h ? ` (${h.savedCount})` : ''}`}
            selected={savedOnly}
            onPress={() => setSavedOnly((v) => !v)}
          />
          <Chip label="Alle Niveaus" selected={level === 'ALL'} onPress={() => setLevel('ALL')} />
          {LEVELS.map((l) => (
            <Chip
              key={l}
              label={l}
              selected={level === l}
              onPress={() => setLevel(level === l ? 'ALL' : l)}
            />
          ))}
        </ScrollView>
        {h && h.categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.bleed}
          >
            <Chip
              label="Alle Funktionen"
              selected={category === 'ALL'}
              onPress={() => setCategory('ALL')}
            />
            {h.categories.map((c) => (
              <Chip
                key={c.key}
                label={`${categoryEmoji(c.key)} ${c.label} · ${c.count}`}
                selected={category === c.key}
                onPress={() => setCategory(category === c.key ? 'ALL' : c.key)}
              />
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.actionsRow}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Überrasch mich"
            disabled={items.length === 0}
            onPress={() => open(items[Math.floor(Math.random() * items.length)])}
            style={[styles.surprise, items.length === 0 && { opacity: 0.4 }]}
          >
            <Ionicons name="dice-outline" size={18} color={REDEMITTEL_COLOR} />
            <AppText variant="small" style={{ fontWeight: '800' }} color="#B0295A">
              Überrasch mich
            </AppText>
          </PressableScale>
          {filtered ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filter zurücksetzen"
              onPress={reset}
              hitSlop={spacing.sm}
            >
              <AppText variant="small" color={colors.primaryDark} style={{ fontWeight: '800' }}>
                Filter zurücksetzen
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );

  let empty = null;
  if (list.isPending) {
    empty = (
      <View accessibilityLabel="Redemittel werden geladen" style={{ gap: spacing.md }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={92} />
        ))}
      </View>
    );
  } else if (list.isError) {
    empty = <ErrorState error={list.error} onRetry={refresh} />;
  } else if (items.length === 0) {
    const onlySaved =
      savedOnly && level === 'ALL' && category === 'ALL' && status === 'ALL' && debounced === '';
    empty = onlySaved ? (
      <EmptyState
        emoji="⭐"
        title="Deine Sammlung ist noch leer."
        message="Speichere Redemittel, die du besonders nützlich findest."
      />
    ) : (
      <EmptyState
        emoji="🔍"
        title="Keine Redemittel gefunden"
        message="Ändere deine Suche oder die Filter."
        actionLabel={filtered ? 'Filter zurücksetzen' : undefined}
        onAction={filtered ? reset : undefined}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        testID="redemittel-list"
        data={empty ? [] : items}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <View style={styles.pad}>
            <RedemittelRow
              item={item}
              onOpen={() => open(item)}
              onToggleSave={() => toggle.mutate(item)}
            />
          </View>
        )}
        ItemSeparatorComponent={Gap}
        ListHeaderComponent={header}
        ListEmptyComponent={empty ? <View style={styles.pad}>{empty}</View> : null}
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <View
              style={{ padding: spacing.lg }}
              accessibilityLabel="Weitere Redemittel werden geladen"
            >
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
            onRefresh={refresh}
          />
        }
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const Gap = () => <View style={{ height: spacing.md }} />;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  pad: { paddingHorizontal: spacing.lg },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  statusTile: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusValue: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  next: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: REDEMITTEL_COLOR,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  phraseChip: {
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: tint(REDEMITTEL_COLOR, '1F'),
  },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  bleed: { marginHorizontal: -spacing.lg },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  surprise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: tint(REDEMITTEL_COLOR, '1F'),
  },
});
