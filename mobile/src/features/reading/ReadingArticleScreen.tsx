import { ErrorNotice } from '@/components/ui';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
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
import { DownloadButton } from '@/features/downloads/DownloadButton';
import { useI18n } from '@/i18n';
import { ltrText } from '@/i18n/direction';
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
import { annotationLabel, buildSegments } from './segments';
import { READING_DARK } from './components/ReadingViz';

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
  const { t } = useI18n();
  const r = t.reading;
  return (
    <View style={styles.legend} accessibilityLabel={r.article.legend}>
      {LEGEND.map(({ type, bg, fg }) => {
        const off = hidden.has(type);
        const label = annotationLabel(r.annotation, type);
        return (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityLabel={off ? r.article.show(label) : r.article.hide(label)}
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
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

/**
 * Key vocabulary as a list of tap-to-reveal rows: full-width touch targets, the meaning slides
 * open under the word, a speaker button reads it aloud, and a thin bar tracks how many are open.
 */
function Glossary({ items }: { items: { word: string; meaning: string }[] }) {
  const { t } = useI18n();
  const a = t.reading.article;
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set());
  const all = shown.size === items.length;
  const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  const toggle = (word: string) => {
    animate();
    setShown((prev) => {
      const next = new Set(prev);
      if (!next.delete(word)) next.add(word);
      return next;
    });
  };
  return (
    <View style={styles.section}>
      <View style={styles.glossaryHead}>
        <View style={styles.sectionHead}>
          <View style={[styles.sectionIcon, { backgroundColor: tint(READING_COLOR, '1F') }]}>
            <Ionicons name="bulb-outline" size={18} color={READING_COLOR} />
          </View>
          <AppText variant="subheading">{a.keyWords}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={all ? a.hideAll : a.showAll}
          onPress={() => {
            animate();
            setShown(all ? new Set() : new Set(items.map((i) => i.word)));
          }}
          hitSlop={spacing.sm}
          style={styles.toggleAll}
        >
          <AppText variant="small" color={READING_COLOR} style={{ fontWeight: '700' }}>
            {all ? a.hideShort : a.showAll}
          </AppText>
        </Pressable>
      </View>
      <AppText variant="small" color={colors.mutedForeground}>
        {a.glossaryHint}
      </AppText>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(shown.size / items.length) * 100}%`, backgroundColor: READING_COLOR },
            ]}
          />
        </View>
        <AppText variant="caption" color={colors.mutedForeground}>
          {a.glossaryCount(shown.size, items.length)}
        </AppText>
      </View>
      <View style={styles.list}>
        {items.map((v) => {
          const open = shown.has(v.word);
          return (
            <View
              key={v.word}
              style={[
                styles.row,
                open && { backgroundColor: tint(READING_COLOR, '14'), borderColor: READING_COLOR },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={open ? `${v.word}: ${v.meaning}` : v.word}
                accessibilityState={{ expanded: open }}
                onPress={() => toggle(v.word)}
                style={styles.rowMain}
              >
                <View style={styles.rowText}>
                  <AppText style={[styles.word, ltrText]}>{v.word}</AppText>
                  {open ? (
                    <AppText color={colors.ink} style={styles.meaning}>
                      {v.meaning}
                    </AppText>
                  ) : null}
                </View>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={open ? READING_COLOR : colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={a.pronounce(v.word)}
                onPress={() => {
                  void Speech.stop();
                  Speech.speak(v.word, { language: 'de-DE' });
                }}
                hitSlop={spacing.xs}
                style={styles.speak}
              >
                <Ionicons name="volume-medium-outline" size={22} color={READING_COLOR} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function ReadingArticleScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const r = t.reading;
  const a = r.article;
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
        <Header title={a.title} back />
        <View accessibilityLabel={a.loading} style={{ gap: spacing.md }}>
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
        <Header title={a.title} back />
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
    const act = active;
    saveWord.mutate(
      {
        lemma: act.lemma,
        type: act.type,
        articleId: article.id,
        sentence: act.exampleSentence ?? '',
        translation: act.translationEn,
      },
      { onSuccess: () => session.save(act.lemma) },
    );
  };

  const nav = (prev || next) && (
    <View style={styles.navRow}>
      <View style={styles.flex}>
        {prev ? (
          <Button
            label={a.prevText}
            variant="secondary"
            accessibilityHint={prev.title}
            onPress={() => goTo(prev.id)}
            color={READING_DARK}
          />
        ) : null}
      </View>
      <View style={styles.flex}>
        {next ? (
          <Button
            label={a.nextText}
            variant="secondary"
            accessibilityHint={next.title}
            onPress={() => goTo(next.id)}
            color={READING_DARK}
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
            <View style={{ flexDirection: 'row' }}>
              <DownloadButton kind="reading" id={article.id} />
              <IconButton
                name={article.bookmarked ? 'star' : 'star-outline'}
                label={article.bookmarked ? r.saved : r.save}
                color={article.bookmarked ? colors.warning : colors.ink}
                busy={bookmarkMutation.isPending}
                onPress={() => bookmarkMutation.mutate(article.bookmarked)}
              />
            </View>
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
                label={a.discoveredRing}
              />
            ) : null
          }
        >
          <View style={styles.meta}>
            {learned ? (
              <InfoPill
                icon="checkmark-circle"
                text={a.readPill}
                color="#1B7A55"
                background={colors.successSoft}
              />
            ) : null}
            {article.newWordCount > 0 ? (
              <Badge tone="warning" label={r.newWords(article.newWordCount)} />
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
              label={a.tileDiscovered}
              value={`${discovered} / ${total}`}
              color={READING_COLOR}
            />
            <StatTile
              icon="bookmark-outline"
              label={a.tileSaved}
              value={String(session.saved.length)}
              color={colors.success}
            />
            <StatTile
              icon="eye-outline"
              label={a.tileReadBy}
              value={String(article.viewCount)}
              color={colors.primary}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sizeRow}>
              <AppText variant="small" color={colors.mutedForeground} style={{ flex: 1 }}>
                {a.tapHint}
              </AppText>
              <TextSizeControl color={READING_COLOR} dark={READING_DARK} />
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
            <ErrorNotice message={(learnedMutation.error ?? bookmarkMutation.error)?.message} />
          ) : null}

          <Button
            pill
            label={a.startQuiz}
            onPress={() =>
              router.push({
                pathname: '/reading/quiz/[articleId]',
                params: { articleId: article.id },
              })
            }
            accessibilityHint={article.quizCompleted ? a.quizDoneHint : undefined}
            color={READING_COLOR}
          />
          {article.quizCompleted ? <Badge tone="success" label={a.quizDone} /> : null}

          <View style={styles.navRow}>
            <View style={styles.flex}>
              <Button
                pill
                label={learned ? a.readPill : a.markRead}
                variant={learned ? 'secondary' : 'primary'}
                loading={learnedMutation.isPending}
                onPress={() => learnedMutation.mutate(!learned)}
                color={READING_DARK}
              />
            </View>
            <View style={styles.flex}>
              <Button
                pill
                label={article.bookmarked ? a.bookmarked : a.bookmark}
                variant="secondary"
                loading={bookmarkMutation.isPending}
                onPress={() => bookmarkMutation.mutate(article.bookmarked)}
                color={READING_DARK}
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
  toggleAll: { minHeight: 36, justifyContent: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  progressFill: { height: '100%', borderRadius: radius.pill },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingStart: spacing.md,
    paddingEnd: spacing.xs,
  },
  rowText: { flex: 1, gap: 2 },
  word: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  meaning: { fontSize: 16, lineHeight: 22 },
  speak: { width: 48, height: 56, alignItems: 'center', justifyContent: 'center' },
  bold: { fontWeight: '700' },
  navRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
