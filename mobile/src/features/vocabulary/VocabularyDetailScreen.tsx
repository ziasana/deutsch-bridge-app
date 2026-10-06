import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  ErrorState,
  ProgressBar,
  Screen,
  Header,
  Skeleton,
} from '@/components/ui';
import { IconButton, PressableScale, StatTile, tint } from '@/features/exam/components/kit';
import { colors, radius, shadow, spacing } from '@/theme';
import { playWordAudio } from './audio';
import { MasteryDots, VocabularyHero } from './components/VocabularyViz';
import { WordFormSheet } from './components/WordFormSheet';
import { useDeleteVocabulary, useToggleVocabularyBookmark, useVocabularyItem } from './listHooks';
import { ARTICLE_COLOR, SOURCE_LABEL, masteryOf, wordLabel } from './listLogic';

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
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <AppText variant="subheading">{title}</AppText>
      </View>
      {children}
    </View>
  );
}

export function VocabularyDetailScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const query = useVocabularyItem(itemId);
  const bookmark = useToggleVocabularyBookmark();
  const remove = useDeleteVocabulary();
  const [editing, setEditing] = useState(false);
  const item = query.data;

  if (query.isPending) {
    return (
      <Screen>
        <Header title="Wort" back />
        <View accessibilityLabel="Wort wird geladen" style={{ gap: spacing.md }}>
          <Skeleton width="60%" height={36} />
          <Skeleton height={120} />
        </View>
      </Screen>
    );
  }
  if (query.isError || !item) {
    return (
      <Screen>
        <Header title="Wort" back />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const mastery = masteryOf(item);
  const overall = Math.round(item.progress?.overallScore ?? 0);
  const editable = item.source !== 'DICTIONARY';
  const accent = item.article ? (ARTICLE_COLOR[item.article] ?? colors.primary) : colors.primary;
  const confirmDelete = () =>
    Alert.alert('Wort löschen?', `„${item.word}“ wird aus deinem Wortschatz entfernt.`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () => remove.mutate(item.id, { onSuccess: () => router.back() }),
      },
    ]);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <VocabularyHero
          chip={`📚 ${SOURCE_LABEL[item.source].toUpperCase()}${item.level ? ` · ${item.level}` : ''}`}
          title={wordLabel(item)}
          trailing={
            <IconButton
              name={item.bookmarked ? 'star' : 'star-outline'}
              label={item.bookmarked ? 'Gemerkt' : 'Merken'}
              color={item.bookmarked ? colors.warning : colors.ink}
              onPress={() => bookmark.mutate({ id: item.id, bookmarked: item.bookmarked })}
            />
          }
          right={
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Aussprache anhören"
              onPress={() => playWordAudio(item.audioUrl, item.word)}
              style={[styles.speaker, { backgroundColor: accent }]}
            >
              <Ionicons name="volume-high" size={28} color="#FFFFFF" />
            </PressableScale>
          }
        >
          <View style={styles.heroMeta}>
            <MasteryDots level={mastery} />
          </View>
        </VocabularyHero>

        <View style={styles.block}>
          <Section icon="bulb-outline" title="Bedeutung">
            <AppText style={styles.meaning}>{item.meaning}</AppText>
          </Section>

          {item.example ? (
            <Section icon="chatbubble-ellipses-outline" title="Beispiel">
              <View style={styles.bubble}>
                <AppText style={{ fontStyle: 'italic', fontWeight: '600' }}>
                  „{item.example}“
                </AppText>
              </View>
            </Section>
          ) : null}

          {item.source === 'CUSTOM' && item.synonyms ? (
            <Section icon="git-compare-outline" title="Synonyme">
              <AppText color={colors.mutedForeground} style={{ fontStyle: 'italic' }}>
                {item.synonyms}
              </AppText>
            </Section>
          ) : null}

          <Section icon="trending-up-outline" title="Dein Fortschritt">
            <ProgressBar value={overall} label="Gesamtfortschritt" />
            <AppText variant="small" color={colors.mutedForeground}>
              Gesamt: {overall}%
            </AppText>
            {item.progress ? (
              <View style={styles.tiles}>
                <StatTile
                  icon="refresh-outline"
                  label="Erinnern"
                  value={`${Math.round(item.progress.recallScore)}%`}
                  color={colors.success}
                />
                <StatTile
                  icon="chatbubbles-outline"
                  label="Kontext"
                  value={`${Math.round(item.progress.contextScore)}%`}
                  color={colors.primary}
                />
                <StatTile
                  icon="repeat-outline"
                  label="Geübt"
                  value={`${item.progress.reviewCount}×`}
                  color={colors.warning}
                />
              </View>
            ) : (
              <AppText variant="small" color={colors.mutedForeground}>
                Du hast dieses Wort noch nicht geübt.
              </AppText>
            )}
          </Section>

          {remove.error ? (
            <AppText color={colors.destructive} accessibilityRole="alert">
              {remove.error.message}
            </AppText>
          ) : null}

          <Button
            pill
            label="Dieses Wort üben"
            onPress={() =>
              router.push({ pathname: '/learn/review', params: { vocabularyItemId: item.id } })
            }
          />
          {editable ? (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Button
                  pill
                  variant="secondary"
                  label="Bearbeiten"
                  onPress={() => setEditing(true)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  pill
                  variant="secondary"
                  label="Löschen"
                  loading={remove.isPending}
                  onPress={confirmDelete}
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
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
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
    backgroundColor: tint(colors.primary, '1F'),
  },
  meaning: { fontSize: 18, lineHeight: 26, fontWeight: '700', color: colors.foreground },
  bubble: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderTopLeftRadius: 6,
    backgroundColor: colors.accent,
  },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
});
