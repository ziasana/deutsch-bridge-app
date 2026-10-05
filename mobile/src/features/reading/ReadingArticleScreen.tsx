import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, Chip, ErrorState, Header, Screen, Skeleton } from '@/components/ui';
import { useReadingSessionStore } from '@/stores/readingSessionStore';
import { colors, radius, spacing } from '@/theme';
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

const FONT_SIZES = [16, 18, 21, 24];

function Legend() {
  return (
    <View style={styles.legend} accessibilityLabel="Legende der Markierungen">
      <View style={[styles.legendItem, { backgroundColor: colors.warningSoft }]}>
        <AppText variant="caption">{ANNOTATION_LABEL.WORD}</AppText>
      </View>
      <View style={[styles.legendItem, { backgroundColor: colors.accent }]}>
        <AppText variant="caption">{ANNOTATION_LABEL.NOMEN_VERB_VERBINDUNG}</AppText>
      </View>
      <View style={[styles.legendItem, { backgroundColor: '#FFE9DB' }]}>
        <AppText variant="caption">{ANNOTATION_LABEL.REDEWENDUNG}</AppText>
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
  const [sizeIndex, setSizeIndex] = useState(1);

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
    () => (article ? buildSegments(article.content, article.tokens ?? [], article.annotations) : []),
    [article],
  );
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
  const goTo = (id: string) => router.replace({ pathname: '/reading/[articleId]', params: { articleId: id } });
  const savedActive = !!active && session.saved.includes(active.lemma);

  const onSave = () => {
    if (!active) return;
    const a = active;
    saveWord.mutate(
      { lemma: a.lemma, type: a.type, articleId: article.id, sentence: a.exampleSentence ?? '', translation: a.translationEn },
      { onSuccess: () => session.save(a.lemma) },
    );
  };

  const nav = (prev || next) && (
    <View style={styles.navRow}>
      <View style={styles.flex}>{prev ? <Button label="‹ Vorheriger Text" variant="secondary" accessibilityHint={prev.title} onPress={() => goTo(prev.id)} /> : null}</View>
      <View style={styles.flex}>{next ? <Button label="Nächster Text ›" variant="secondary" accessibilityHint={next.title} onPress={() => goTo(next.id)} /> : null}</View>
    </View>
  );

  return (
    <Screen>
      <Header title={article.title} back />
      <View style={styles.meta}>
        <Badge tone="primary" label={article.level} />
        {article.categoryTitle ? <Badge label={article.categoryTitle} /> : null}
        {learned ? <Badge tone="success" label="✓ Gelesen" /> : null}
        {article.newWordCount > 0 ? <Badge tone="warning" label={`${article.newWordCount} neue Wörter`} /> : null}
      </View>

      {image ? <Image source={{ uri: image }} contentFit="cover" style={styles.image} accessibilityIgnoresInvertColors /> : null}

      <Card style={{ gap: spacing.md }}>
        <View style={styles.sizeRow}>
          <AppText variant="small" color={colors.mutedForeground}>
            Tippe auf markierte Wörter oder auf jedes Wort.
          </AppText>
          <View style={styles.sizeButtons}>
            <Chip label="A−" selected={false} onPress={() => setSizeIndex((i) => Math.max(0, i - 1))} />
            <Chip label="A+" selected={false} onPress={() => setSizeIndex((i) => Math.min(FONT_SIZES.length - 1, i + 1))} />
          </View>
        </View>
        <Legend />
        <ArticleText
          segments={segments}
          fontSize={FONT_SIZES[sizeIndex]}
          activeAnnotationId={active?.id ?? null}
          tappedLemmas={session.tapped}
          onAnnotation={(a) => {
            setActive(a);
            session.tap(a.lemma);
          }}
          onWord={(lemma) => setDictLemma(lemma)}
        />
      </Card>

      {glossary.length > 0 ? (
        <Card style={{ gap: spacing.sm }}>
          <AppText variant="subheading">💡 Wichtige Wörter</AppText>
          {glossary.map((v) => (
            <View key={v.word} style={styles.glossaryRow}>
              <AppText style={styles.bold}>{v.word}</AppText>
              <AppText color={colors.mutedForeground} style={styles.flex}>
                {v.meaning}
              </AppText>
            </View>
          ))}
        </Card>
      ) : null}

      {learnedMutation.error || bookmarkMutation.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {(learnedMutation.error ?? bookmarkMutation.error)?.message}
        </AppText>
      ) : null}

      <Button
        label="Quiz zum Text starten"
        onPress={() => router.push({ pathname: '/reading/quiz/[articleId]', params: { articleId: article.id } })}
        accessibilityHint={article.quizCompleted ? 'Du hast das Quiz schon einmal abgeschlossen' : undefined}
      />
      {article.quizCompleted ? <Badge tone="success" label="✓ Quiz abgeschlossen" /> : null}

      <View style={styles.navRow}>
        <View style={styles.flex}>
          <Button
            label={learned ? '✓ Gelesen' : 'Als gelesen markieren'}
            variant={learned ? 'secondary' : 'primary'}
            loading={learnedMutation.isPending}
            onPress={() => learnedMutation.mutate(!learned)}
          />
        </View>
        <View style={styles.flex}>
          <Button
            label={article.bookmarked ? '★ Gemerkt' : '☆ Merken'}
            variant="secondary"
            loading={bookmarkMutation.isPending}
            onPress={() => bookmarkMutation.mutate(article.bookmarked)}
          />
        </View>
      </View>

      {nav}

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  image: { width: '100%', height: 190, borderRadius: radius.md, backgroundColor: colors.muted },
  sizeRow: { gap: spacing.sm },
  sizeButtons: { flexDirection: 'row', gap: spacing.sm },
  legend: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  legendItem: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  glossaryRow: { flexDirection: 'row', gap: spacing.md },
  bold: { fontWeight: '700', minWidth: 110 },
  navRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
