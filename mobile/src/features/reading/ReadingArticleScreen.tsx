import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  ErrorState,
  Header,
  ProgressRing,
  Screen,
  Skeleton,
} from '@/components/ui';
import { IconButton, StatTile, TextSizeControl, tint } from '@/features/exam/components/kit';
import { useExamTextScale } from '@/features/exam/textScale';
import { InfoPill, READING_COLOR, ReadingHero } from './components/ReadingViz';
import { useReadingSessionStore } from '@/stores/readingSessionStore';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Annotation } from '@/types/reading';
import { resolveUploadUrl } from '@/utils/urls';
import { ArticleText } from './components/ArticleText';
import { AnnotationSheet, DictionarySheet } from './components/WordSheets';
import {
  useReadingArticle,
  useReadingNavigation,
  useRecordView,
  useSaveToLexicon,
  useSetArticleLearned,
  useToggleArticleBookmark,
} from './hooks';
import { ANNOTATION_LABEL, buildSegments } from './segments';

const LEGEND: { type: Annotation['type']; bg: string; fg: string }[] = [
  { type: 'WORD', bg: colors.warningSoft, fg: '#8A5A00' },
  { type: 'NOMEN_VERB_VERBINDUNG', bg: colors.accent, fg: colors.primaryDark },
  { type: 'REDEWENDUNG', bg: '#FFE9DB', fg: '#B4531A' },
];

/** The legend doubles as a switch: tap a type to hide or show its highlight in the text. */
function Legend({
  hidden,
  onToggle,
}: {
  hidden: ReadonlySet<Annotation['type']>;
  onToggle: (type: Annotation['type']) => void;
}) {
  return (
    <View style={styles.legend} accessibilityLabel="Legende der Markierungen">
      {LEGEND.map(({ type, bg, fg }) => {
        const off = hidden.has(type);
        return (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityLabel={`${ANNOTATION_LABEL[type]} ${off ? 'einblenden' : 'ausblenden'}`}
            accessibilityState={{ selected: !off }}
            onPress={() => onToggle(type)}
            style={[styles.legendItem, { backgroundColor: off ? colors.muted : bg }]}
          >
            <Ionicons
              name={off ? 'eye-off-outline' : 'eye-outline'}
              size={13}
              color={off ? colors.mutedForeground : fg}
            />
            <AppText
              variant="caption"
              color={off ? colors.mutedForeground : fg}
              style={{ fontWeight: '700' }}
            >
              {ANNOTATION_LABEL[type]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Key vocabulary as flip cards: tap a word to see its meaning, "Alle zeigen" flips them all. */
function Glossary({ items }: { items: { word: string; meaning: string }[] }) {
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set());
  const all = shown.size === items.length;
  const toggle = (word: string) =>
    setShown((prev) => {
      const next = new Set(prev);
      if (!next.delete(word)) next.add(word);
      return next;
    });
  return (
    <View style={styles.section}>
      <View style={styles.glossaryHead}>
        <View style={styles.sectionHead}>
          <View style={[styles.sectionIcon, { backgroundColor: tint(READING_COLOR, '1F') }]}>
            <Ionicons name="bulb-outline" size={18} color={READING_COLOR} />
          </View>
          <AppText variant="subheading">💡 Wichtige Wörter</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={all ? 'Alle verbergen' : 'Alle zeigen'}
          onPress={() => setShown(all ? new Set() : new Set(items.map((i) => i.word)))}
          hitSlop={spacing.sm}
        >
          <AppText variant="small" color={colors.primaryDark} style={{ fontWeight: '700' }}>
            {all ? 'Verbergen' : 'Alle zeigen'}
          </AppText>
        </Pressable>
      </View>
      <AppText variant="small" color={colors.mutedForeground}>
        Tippe auf ein Wort, um die Bedeutung zu sehen.
      </AppText>
      <View style={styles.cards}>
        {items.map((v) => {
          const open = shown.has(v.word);
          return (
            <Pressable
              key={v.word}
              accessibilityRole="button"
              accessibilityLabel={open ? `${v.word}: ${v.meaning}` : v.word}
              accessibilityState={{ expanded: open }}
              onPress={() => toggle(v.word)}
              style={[
                styles.wordCard,
                open && { backgroundColor: tint(READING_COLOR, '1F'), borderColor: READING_COLOR },
              ]}
            >
              <AppText style={styles.bold}>{v.word}</AppText>
              {open ? (
                <AppText variant="small" color={colors.ink}>
                  {v.meaning}
                </AppText>
              ) : (
                <Ionicons name="eye-outline" size={16} color={colors.mutedForeground} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ReadingArticleScreen() {
  const router = useRouter();
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  const query = useReadingArticle(articleId);
  const navigation = useReadingNavigation(articleId);
  const learnedMutation = useSetArticleLearned(articleId);
  const bookmarkMutation = useToggleArticleBookmark(articleId);
  const recordView = useRecordView();
  const saveWord = useSaveToLexicon();

  const session = useReadingSessionStore();
  const [active, setActive] = useState<Annotation | null>(null);
  const [dictLemma, setDictLemma] = useState<string | null>(null);
  const [hidden, setHidden] = useState<ReadonlySet<Annotation['type']>>(new Set());
  const textScale = useExamTextScale();

  useEffect(() => {
    if (articleId) session.start(articleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  // Count a view once per open, even when the article came from the cache.
  const counted = useRef<string | null>(null);
  useEffect(() => {
    if (articleId && counted.current !== articleId) {
      counted.current = articleId;
      recordView.mutate(articleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const article = query.data;
  const segments = useMemo(
    () =>
      article ? buildSegments(article.content, article.tokens ?? [], article.annotations) : [],
    [article],
  );
  const toggleType = (type: Annotation['type']) =>
    setHidden((prevSet) => {
      const nextSet = new Set(prevSet);
      if (!nextSet.delete(type)) nextSet.add(type);
      return nextSet;
    });
  const glossary = useMemo(() => {
    const byWord = new Map<string, { word: string; meaning: string }>();
    for (const v of article?.keyVocabulary ?? []) if (!byWord.has(v.word)) byWord.set(v.word, v);
    return [...byWord.values()].sort((a, b) => a.word.localeCompare(b.word));
  }, [article?.keyVocabulary]);

  if (query.isPending) {
    return (
      <Screen>
        <Header title="Text" back />
        <View accessibilityLabel="Text wird geladen" style={{ gap: spacing.md }}>
          <Skeleton width="80%" height={32} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={18} />
          ))}
        </View>
      </Screen>
    );
  }
  if (query.isError || !article) {
    return (
      <Screen>
        <Header title="Text" back />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const learned = article.learningProgresses?.some((lp) => lp.learned) ?? false;
  const image = resolveUploadUrl(article.imageUrl);
  const prev = navigation.data?.previous;
  const next = navigation.data?.next;
  const goTo = (id: string) =>
    router.replace({ pathname: '/reading/[articleId]', params: { articleId: id } });
  const savedActive = !!active && session.saved.includes(active.lemma);

  const onSave = () => {
    if (!active) return;
    const a = active;
    saveWord.mutate(
      {
        lemma: a.lemma,
        type: a.type,
        articleId: article.id,
        sentence: a.exampleSentence ?? '',
        translation: a.translationEn,
      },
      { onSuccess: () => session.save(a.lemma) },
    );
  };

  const nav = (prev || next) && (
    <View style={styles.navRow}>
      <View style={styles.flex}>
        {prev ? (
          <Button
            label="‹ Vorheriger Text"
            variant="secondary"
            accessibilityHint={prev.title}
            onPress={() => goTo(prev.id)}
          />
        ) : null}
      </View>
      <View style={styles.flex}>
        {next ? (
          <Button
            label="Nächster Text ›"
            variant="secondary"
            accessibilityHint={next.title}
            onPress={() => goTo(next.id)}
          />
        ) : null}
      </View>
    </View>
  );

  const total = article.annotations.filter((x) => !x.known).length;
  const discovered = Math.min(session.tapped.length, total);
  const percent = total > 0 ? (discovered / total) * 100 : 0;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ReadingHero
          chip={`📖 ${article.level}${article.categoryTitle ? ` · ${article.categoryTitle}`.toUpperCase() : ''}`}
          title={article.title}
          trailing={
            <IconButton
              name={article.bookmarked ? 'star' : 'star-outline'}
              label={article.bookmarked ? 'Gemerkt' : 'Merken'}
              color={article.bookmarked ? colors.warning : colors.ink}
              busy={bookmarkMutation.isPending}
              onPress={() => bookmarkMutation.mutate(article.bookmarked)}
            />
          }
          right={
            total > 0 ? (
              <ProgressRing
                value={percent}
                size={72}
                stroke={8}
                color={READING_COLOR}
                textSize={16}
                trackColor="#FFFFFFCC"
                label="Entdeckte Wörter"
              />
            ) : null
          }
        >
          <View style={styles.meta}>
            {learned ? (
              <InfoPill
                icon="checkmark-circle"
                text="✓ Gelesen"
                color="#1B7A55"
                background={colors.successSoft}
              />
            ) : null}
            {article.newWordCount > 0 ? (
              <Badge tone="warning" label={`${article.newWordCount} neue Wörter`} />
            ) : null}
          </View>
        </ReadingHero>

        <View style={styles.block}>
          {image ? (
            <Image
              source={{ uri: image }}
              contentFit="cover"
              style={styles.image}
              accessibilityIgnoresInvertColors
            />
          ) : null}

          <View style={styles.tiles}>
            <StatTile
              icon="sparkles-outline"
              label="Entdeckt"
              value={`${discovered} / ${total}`}
              color={READING_COLOR}
            />
            <StatTile
              icon="bookmark-outline"
              label="Gespeichert"
              value={String(session.saved.length)}
              color={colors.success}
            />
            <StatTile
              icon="eye-outline"
              label="Gelesen von"
              value={String(article.viewCount)}
              color={colors.primary}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sizeRow}>
              <AppText variant="small" color={colors.mutedForeground} style={{ flex: 1 }}>
                Tippe auf markierte Wörter oder auf jedes Wort.
              </AppText>
              <TextSizeControl />
            </View>
            <Legend hidden={hidden} onToggle={toggleType} />
            <ArticleText
              segments={segments}
              fontSize={Math.round(18 * textScale)}
              activeAnnotationId={active?.id ?? null}
              tappedLemmas={session.tapped}
              hiddenTypes={hidden}
              onAnnotation={(a) => {
                setActive(a);
                session.tap(a.lemma);
              }}
              onWord={(lemma) => setDictLemma(lemma)}
            />
          </View>

          {glossary.length > 0 ? <Glossary items={glossary} /> : null}

          {learnedMutation.error || bookmarkMutation.error ? (
            <AppText color={colors.destructive} accessibilityRole="alert">
              {(learnedMutation.error ?? bookmarkMutation.error)?.message}
            </AppText>
          ) : null}

          <Button
            pill
            label="Quiz zum Text starten"
            onPress={() =>
              router.push({
                pathname: '/reading/quiz/[articleId]',
                params: { articleId: article.id },
              })
            }
            accessibilityHint={
              article.quizCompleted ? 'Du hast das Quiz schon einmal abgeschlossen' : undefined
            }
          />
          {article.quizCompleted ? <Badge tone="success" label="✓ Quiz abgeschlossen" /> : null}

          <View style={styles.navRow}>
            <View style={styles.flex}>
              <Button
                pill
                label={learned ? '✓ Gelesen' : 'Als gelesen markieren'}
                variant={learned ? 'secondary' : 'primary'}
                loading={learnedMutation.isPending}
                onPress={() => learnedMutation.mutate(!learned)}
              />
            </View>
            <View style={styles.flex}>
              <Button
                pill
                label={article.bookmarked ? '★ Gemerkt' : '☆ Merken'}
                variant="secondary"
                loading={bookmarkMutation.isPending}
                onPress={() => bookmarkMutation.mutate(article.bookmarked)}
              />
            </View>
          </View>

          {nav}
        </View>
      </ScrollView>

      <AnnotationSheet
        annotation={active}
        saved={savedActive}
        saving={saveWord.isPending}
        error={saveWord.error?.message}
        onSave={onSave}
        onClose={() => {
          setActive(null);
          saveWord.reset();
        }}
      />
      <DictionarySheet lemma={dictLemma} onClose={() => setDictLemma(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  block: { padding: spacing.lg, gap: spacing.lg },
  meta: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm },
  image: { width: '100%', height: 190, borderRadius: radius.lg, backgroundColor: colors.muted },
  tiles: { flexDirection: 'row', gap: spacing.sm },
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
  },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  legend: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  glossaryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  wordCard: {
    gap: 2,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  bold: { fontWeight: '700' },
  navRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
