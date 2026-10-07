import { ErrorNotice } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  ErrorState,
  ProgressBar,
  Screen,
  Header,
  Skeleton,
} from '@/components/ui';
import { IconButton, PressableScale, StatTile, tint } from '@/features/exam/components/kit';
import { useI18n } from '@/i18n';
import { colors, radius, shadow, spacing } from '@/theme';
import { playWordAudio } from './audio';
import { MasteryDots, VocabularyHero } from './components/VocabularyViz';
import { WordFormSheet } from './components/WordFormSheet';
import { useDeleteVocabulary, useToggleVocabularyBookmark, useVocabularyItem } from './listHooks';
import { ARTICLE_COLOR, masteryOf, wordLabel } from './listLogic';
import { VOCABULARY_COLOR, VOCABULARY_DARK } from './meta';

function Section({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={18} color={VOCABULARY_COLOR} />
        </View>
        <AppText variant="subheading">{title}</AppText>
      </View>
      {children}
    </View>
  );
}

export function VocabularyDetailScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const v = t.vocabulary;
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const query = useVocabularyItem(itemId);
  const bookmark = useToggleVocabularyBookmark();
  const remove = useDeleteVocabulary();
  const [editing, setEditing] = useState(false);
  const item = query.data;

  if (query.isPending) {
    return (
      <Screen>
        <Header title={v.word} back />
        <View accessibilityLabel={v.loadingWord} style={{ gap: spacing.md }}>
          <Skeleton width="60%" height={36} />
          <Skeleton height={120} />
        </View>
      </Screen>
    );
  }
  if (query.isError || !item) {
    return (
      <Screen>
        <Header title={v.word} back />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const mastery = masteryOf(item);
  const overall = Math.round(item.progress?.overallScore ?? 0);
  const editable = item.source !== 'DICTIONARY';
  const accent = item.article
    ? (ARTICLE_COLOR[item.article] ?? VOCABULARY_COLOR)
    : VOCABULARY_COLOR;
  const confirmDelete = () =>
    Alert.alert(v.deleteTitle, v.deleteMessage(item.word), [
      { text: v.cancel, style: 'cancel' },
      {
        text: v.delete,
        style: 'destructive',
        onPress: () => remove.mutate(item.id, { onSuccess: () => router.back() }),
      },
    ]);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <VocabularyHero
          chip={`${v.chip(v.sources[item.source])}${item.level ? ` · ${item.level}` : ''}`}
          title={wordLabel(item)}
          trailing={
            <IconButton
              name={item.bookmarked ? 'star' : 'star-outline'}
              label={item.bookmarked ? v.saved : v.save}
              color={item.bookmarked ? colors.warning : colors.ink}
              onPress={() => bookmark.mutate({ id: item.id, bookmarked: item.bookmarked })}
            />
          }
          right={
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={v.listen}
              onPress={() => playWordAudio(item.audioUrl, item.word)}
              style={[styles.speaker, { backgroundColor: accent }]}
            >
              <Ionicons name="volume-high" size={28} color="#FFFFFF" />
            </PressableScale>
          }
        >
          <View style={styles.heroMeta}>
            {item.wordType ? <Badge label={v.wordTypes[item.wordType]} /> : null}
            <MasteryDots level={mastery} />
          </View>
        </VocabularyHero>

        <View style={styles.block}>
          <Section icon="bulb-outline" title={v.meaning}>
            <AppText style={styles.meaning}>{item.meaning}</AppText>
          </Section>

          {item.example ? (
            <Section icon="chatbubble-ellipses-outline" title={v.example}>
              <View style={styles.bubble}>
                <AppText style={{ fontStyle: 'italic', fontWeight: '600' }}>
                  “{item.example}”
                </AppText>
              </View>
            </Section>
          ) : null}

          {item.synonyms ? (
            <Section icon="git-compare-outline" title={v.synonyms}>
              <AppText color={colors.mutedForeground} style={{ fontStyle: 'italic' }}>
                {item.synonyms}
              </AppText>
            </Section>
          ) : null}

          <Section icon="trending-up-outline" title={v.progress}>
            <ProgressBar value={overall} label={v.overall} />
            <AppText variant="small" color={colors.mutedForeground}>
              {v.overallValue(overall)}
            </AppText>
            {item.progress ? (
              <View style={styles.tiles}>
                <StatTile
                  icon="refresh-outline"
                  label={v.recall}
                  value={`${Math.round(item.progress.recallScore)}%`}
                  color={colors.success}
                />
                <StatTile
                  icon="chatbubbles-outline"
                  label={v.context}
                  value={`${Math.round(item.progress.contextScore)}%`}
                  color={VOCABULARY_COLOR}
                />
                <StatTile
                  icon="repeat-outline"
                  label={v.practised}
                  value={`${item.progress.reviewCount}×`}
                  color={colors.warning}
                />
              </View>
            ) : (
              <AppText variant="small" color={colors.mutedForeground}>
                {v.notPracticed}
              </AppText>
            )}
          </Section>

          {remove.error ? <ErrorNotice error={remove.error} /> : null}

          <Button
            pill
            label={v.practiseWord}
            onPress={() =>
              router.push({ pathname: '/learn/review', params: { vocabularyItemId: item.id } })
            }
            color={VOCABULARY_COLOR}
          />
          {editable ? (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Button
                  pill
                  variant="secondary"
                  label={v.edit}
                  onPress={() => setEditing(true)}
                  color={VOCABULARY_DARK}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  pill
                  variant="secondary"
                  label={v.delete}
                  loading={remove.isPending}
                  onPress={confirmDelete}
                  color={VOCABULARY_DARK}
                />
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <WordFormSheet visible={editing} item={item} onClose={() => setEditing(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  block: { padding: spacing.lg, gap: spacing.lg },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  speaker: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tint(VOCABULARY_COLOR, '1F'),
  },
  meaning: { fontSize: 18, lineHeight: 26, fontWeight: '700', color: colors.foreground },
  bubble: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderTopStartRadius: 6,
    backgroundColor: tint(VOCABULARY_COLOR, '1F'),
  },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
});
