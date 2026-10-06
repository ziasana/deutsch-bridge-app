import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RichBlocks } from '@/components/content/RichContent';
import { parseBlocks } from '@/components/content/parse';
import {
  AppText,
  Badge,
  Button,
  Card,
  Chip,
  ErrorState,
  Header,
  ProgressBar,
  ProgressRing,
  Screen,
  Skeleton,
} from '@/components/ui';
import { IconButton, StatTile, TextSizeControl, tint } from '@/features/exam/components/kit';
import { RichContentScale } from '@/features/exam/components/RichContentScale';
import { rtlText } from '@/i18n/direction';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { HorizontalScroll } from '@/components/ui/HorizontalScroll';
import { colors, radius, spacing } from '@/theme';
import { useLesson, useLessonNavigation, useSetLessonLearned, useToggleBookmark } from './hooks';
import {
  ExampleBubble,
  InteractiveTable,
  QuickCheck,
  SectionCard,
  TipCallout,
  splitSections,
  toExampleBubbles,
} from './components/LessonViz';
import {
  isLessonLearned,
  isPlayableQuestion,
  localizedQuestion,
  isTranslatableLevel,
  lessonQuestions,
  localizedHeading,
  localizedLesson,
} from './quiz';

function LessonSkeleton() {
  const { t } = useI18n();
  return (
    <View accessibilityLabel={t.grammar.lessonLoading} style={{ gap: spacing.md }}>
      <Skeleton width="70%" height={32} />
      <Skeleton height={16} />
      <Card style={{ gap: spacing.sm }}>
        <Skeleton height={16} />
        <Skeleton height={16} />
        <Skeleton width="80%" height={16} />
      </Card>
    </View>
  );
}

/** "Das lernst du": the lesson summary as a goal card, clamped to two lines until expanded. */
function GoalCard({ summary, dir }: { summary: string; dir: 'ltr' | 'rtl' }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const long = summary.length > 90;
  return (
    <View style={styles.goal}>
      <View style={styles.goalHead}>
        <View style={styles.goalIcon}>
          <AppText style={{ fontSize: 18, lineHeight: 24 }}>🎯</AppText>
        </View>
        <AppText variant="subheading" style={{ flex: 1 }}>
          {t.grammar.goalTitle}
        </AppText>
        <TextSizeControl />
      </View>
      <AppText
        color={colors.ink}
        numberOfLines={expanded || !long ? undefined : 2}
        style={dir === 'rtl' ? rtlText : undefined}
      >
        {summary}
      </AppText>
      {long ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? t.grammar.showLess : t.grammar.showMore}
          onPress={() => setExpanded((v) => !v)}
          hitSlop={spacing.sm}
        >
          <AppText variant="small" color={colors.primaryDark} style={{ fontWeight: '700' }}>
            {expanded ? t.grammar.less : t.grammar.more}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

type AnchorKey = 'learn' | 'example' | 'tip' | 'practice';

export function LessonScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const g = t.grammar;
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const persian = useAuthStore((s) => s.profile?.preferredLanguage === 'PR');
  const lessonQuery = useLesson(lessonId);
  const navigation = useLessonNavigation(lessonId);
  const learnedMutation = useSetLessonLearned(lessonId);
  const bookmarkMutation = useToggleBookmark(lessonId);

  const scroller = useRef<ScrollView>(null);
  const [anchors, setAnchors] = useState<Partial<Record<AnchorKey, number>>>({});
  const [opened, setOpened] = useState<ReadonlySet<number>>(new Set([0]));
  const [seen, setSeen] = useState<ReadonlySet<number>>(new Set([0]));

  const goTo = (id: string) =>
    router.replace({ pathname: '/grammar/[lessonId]', params: { lessonId: id } });
  const lesson = lessonQuery.data;
  const content = lesson ? localizedLesson(lesson, persian).content : '';
  const exampleSource = lesson ? localizedLesson(lesson, persian).example : '';
  const sections = useMemo(() => splitSections(parseBlocks(content)), [content]);
  const examples = useMemo(() => toExampleBubbles(parseBlocks(exampleSource)), [exampleSource]);

  if (lessonQuery.isPending) {
    return (
      <Screen>
        <Header title={g.lesson} back />
        <LessonSkeleton />
      </Screen>
    );
  }
  if (lessonQuery.isError || !lesson) {
    return (
      <Screen>
        <Header title={g.lesson} back />
        <ErrorState error={lessonQuery.error} onRetry={() => void lessonQuery.refetch()} />
      </Screen>
    );
  }

  const text = localizedLesson(lesson, persian);
  const learned = isLessonLearned(lesson);
  const quizCount = lessonQuestions(lesson).length;
  const dir = text.dir;
  const prev = navigation.data?.previous;
  const next = navigation.data?.next;
  const mutationError = learnedMutation.error ?? bookmarkMutation.error;

  const toggleSection = (i: number) => {
    setOpened((prevSet) => {
      const nextSet = new Set(prevSet);
      if (!nextSet.delete(i)) nextSet.add(i);
      return nextSet;
    });
    // "Explored" only ever grows: collapsing a section never lowers the progress.
    setSeen((prevSet) => (prevSet.has(i) ? prevSet : new Set(prevSet).add(i)));
  };
  const explored = Math.min(seen.size, sections.length);
  const progress = learned ? 100 : sections.length > 0 ? (explored / sections.length) * 100 : 0;

  const quickQuestion = lesson.quiz.find(
    (q) => (q.type === 'mcq' || q.type === 'truefalse') && isPlayableQuestion(q),
  );
  const quick = quickQuestion ? localizedQuestion(quickQuestion, lesson.level, persian) : null;

  const anchor = (key: AnchorKey) => ({
    onLayout: (e: { nativeEvent: { layout: { y: number } } }) => {
      const y = e.nativeEvent.layout.y;
      setAnchors((a) => (a[key] === y ? a : { ...a, [key]: y }));
    },
  });
  const jump = (key: AnchorKey) =>
    scroller.current?.scrollTo({
      y: Math.max(0, (anchors[key] ?? 0) - spacing.md),
      animated: true,
    });

  const steps: { key: AnchorKey; label: string; show: boolean }[] = [
    { key: 'learn', label: g.stepLearn, show: sections.length > 0 },
    { key: 'example', label: g.stepExamples, show: examples.length > 0 },
    { key: 'tip', label: g.stepTip, show: !!text.usageTips },
    { key: 'practice', label: g.stepPractise, show: quizCount > 0 || !!quick },
  ];

  const renderBlocks = (blocks: ReturnType<typeof parseBlocks>) =>
    blocks.map((b, i) =>
      b.t === 'table' ? (
        <InteractiveTable key={i} rows={b.rows} dir={dir} />
      ) : (
        <RichBlocks key={i} blocks={[b]} dir={dir} />
      ),
    );

  return (
    <RichContentScale>
      <View style={styles.root}>
        <ScrollView
          ref={scroller}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={[styles.hero, { backgroundColor: tint(colors.primary, '1F') }]}>
            <SafeAreaView edges={['top']}>
              <View style={styles.topRow}>
                <IconButton name="arrow-back" label={t.common.back} onPress={() => router.back()} />
                <IconButton
                  name={lesson.bookmarked ? 'star' : 'star-outline'}
                  label={lesson.bookmarked ? g.unbookmark : g.bookmark}
                  color={lesson.bookmarked ? colors.warning : colors.ink}
                  busy={bookmarkMutation.isPending}
                  onPress={() => bookmarkMutation.mutate(lesson.bookmarked)}
                />
              </View>
              <View style={styles.heroMain}>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <View style={styles.meta}>
                    <View style={[styles.chip, { backgroundColor: tint(colors.primary, '33') }]}>
                      <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
                        📘 {lesson.level}
                        {lesson.categoryTitle ? ` · ${lesson.categoryTitle}`.toUpperCase() : ''}
                      </AppText>
                    </View>
                    {learned ? <Badge tone="success" label={g.learnedBadge} /> : null}
                    {persian && !isTranslatableLevel(lesson.level) ? (
                      <Badge label={g.germanOnly} />
                    ) : null}
                  </View>
                  <AppText style={styles.title} accessibilityRole="header">
                    {text.title}
                  </AppText>
                </View>
                <ProgressRing
                  value={progress}
                  size={76}
                  stroke={9}
                  color={colors.primary}
                  textSize={18}
                  trackColor="#FFFFFFCC"
                  label={g.lessonProgress}
                />
              </View>
            </SafeAreaView>
          </View>

          {text.summary ? (
            <View style={styles.block}>
              <GoalCard summary={text.summary} dir={dir} />
            </View>
          ) : null}

          <View style={styles.tiles}>
            <StatTile
              icon="layers-outline"
              label={g.steps}
              value={String(sections.length)}
              color={colors.primary}
            />
            <StatTile
              icon="chatbubbles-outline"
              label={g.examples}
              value={String(examples.length)}
              color={colors.primary}
            />
            <StatTile
              icon="help-circle-outline"
              label={g.questions}
              value={String(quizCount)}
              color={colors.success}
            />
          </View>

          <HorizontalScroll
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={{ flexGrow: 0 }}
          >
            {steps
              .filter((s) => s.show)
              .map((s) => (
                <Chip key={s.key} label={s.label} selected={false} onPress={() => jump(s.key)} />
              ))}
          </HorizontalScroll>

          {sections.length > 0 ? (
            <View style={styles.block} {...anchor('learn')}>
              {sections.map((section, i) =>
                section.title === null ? (
                  <Card key={i} style={{ gap: spacing.md }}>
                    {renderBlocks(section.blocks)}
                  </Card>
                ) : (
                  <SectionCard
                    key={i}
                    index={i + 1 - (sections[0].title === null ? 1 : 0)}
                    title={section.title}
                    open={opened.has(i)}
                    onToggle={() => toggleSection(i)}
                  >
                    {renderBlocks(section.blocks)}
                  </SectionCard>
                ),
              )}
            </View>
          ) : null}

          {lesson.videoLink ? (
            <View style={styles.block}>
              <Button
                label={g.watchVideo}
                variant="secondary"
                onPress={() => void Linking.openURL(lesson.videoLink!)}
              />
            </View>
          ) : null}

          {examples.length > 0 ? (
            <View style={styles.block} {...anchor('example')}>
              <AppText variant="heading">{g.exampleHeading}</AppText>
              {examples.map((blocks, i) => (
                <ExampleBubble key={i} blocks={blocks} dir={dir} />
              ))}
            </View>
          ) : null}

          {text.usageTips ? (
            <View style={styles.block} {...anchor('tip')}>
              <TipCallout>
                <AppText variant="subheading">{g.tipHeading}</AppText>
                <RichBlocks blocks={parseBlocks(text.usageTips)} dir={dir} />
              </TipCallout>
            </View>
          ) : null}

          {quickQuestion && quick ? (
            <View style={styles.block} {...anchor('practice')}>
              <Card style={{ gap: spacing.md }}>
                <AppText variant="heading">{g.quickCheck}</AppText>
                <QuickCheck
                  key={lesson.id}
                  question={quickQuestion}
                  title={quick.title}
                  text={quick.question}
                  dir={quick.dir}
                />
              </Card>
            </View>
          ) : null}

          <View style={styles.block} {...(!quickQuestion ? anchor('practice') : {})}>
            {quizCount > 0 ? (
              <Card tone="accent" style={{ gap: spacing.sm }}>
                <AppText variant="subheading">{g.exercisesHeading}</AppText>
                <AppText color={colors.mutedForeground}>{g.questionsForLesson(quizCount)}</AppText>
                <Button
                  pill
                  label={g.startExercises}
                  onPress={() =>
                    router.push({
                      pathname: '/grammar/practice/[lessonId]',
                      params: { lessonId: lesson.id },
                    })
                  }
                />
              </Card>
            ) : null}

            {sections.length > 1 ? (
              <View style={{ gap: spacing.xs }}>
                <AppText variant="small" color={colors.mutedForeground}>
                  {learned ? g.allStepsLearned : g.stepsViewed(explored, sections.length)}
                </AppText>
                <ProgressBar value={progress} label={g.lessonProgressBar} />
              </View>
            ) : null}

            {mutationError ? (
              <AppText color={colors.destructive} accessibilityRole="alert">
                {mutationError.message}
              </AppText>
            ) : null}

            <Button
              pill
              label={learned ? g.resetLearned : g.markLearned}
              variant={learned ? 'secondary' : 'primary'}
              loading={learnedMutation.isPending}
              onPress={() => learnedMutation.mutate(!learned)}
            />

            {prev || next ? (
              <View style={styles.navRow} accessibilityRole="toolbar">
                <View style={styles.flex}>
                  {prev ? (
                    <Button
                      label={g.previous}
                      variant="secondary"
                      onPress={() => goTo(prev.id)}
                      accessibilityHint={
                        localizedHeading({ ...prev, summary: '', summaryFa: null }, persian).title
                      }
                    />
                  ) : null}
                </View>
                <View style={styles.flex}>
                  {next ? (
                    <Button
                      label={g.next}
                      variant="secondary"
                      onPress={() => goTo(next.id)}
                      accessibilityHint={
                        localizedHeading({ ...next, summary: '', summaryFa: null }, persian).title
                      }
                    />
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </RichContentScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.sm,
  },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingTop: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.ink },
  goal: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  goalIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  tiles: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  block: { paddingHorizontal: spacing.lg, gap: spacing.md },
  navRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
