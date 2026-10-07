import { ErrorNotice } from '@/components/ui';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  ErrorState,
  Header,
  ProgressBar,
  Screen,
  Skeleton,
} from '@/components/ui';
import { IconButton, TextSizeControl, tint } from '@/features/exam/components/kit';
import { scaledText, useExamTextScale } from '@/features/exam/textScale';
import { ExpressionHero, MasteryDots, MasteryPath } from './components/ExpressionViz';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, shadow, spacing } from '@/theme';
import { resolveUploadUrl } from '@/utils/urls';
import {
  useExpression,
  useExpressionNavigation,
  useMarkViewed,
  useToggleExpressionBookmark,
} from './hooks';
import {
  CONTEXT_LABEL,
  EXPRESSION_COLOR,
  REGISTER_LABEL,
  TYPE_COLOR,
  TYPE_EMOJI,
  TYPE_SINGULAR,
} from './labels';
import { EXPRESSION_DARK } from './labels';

/** Body text that follows the learner's text size (the same setting as in the exam and lessons). */
function Body({
  small,
  big,
  bold,
  semi,
  italic,
  color,
  style,
  children,
}: {
  small?: boolean;
  big?: boolean;
  bold?: boolean;
  semi?: boolean;
  italic?: boolean;
  color?: string;
  style?: object;
  children: React.ReactNode;
}) {
  const scale = useExamTextScale();
  const [size, line] = small ? [14, 20] : big ? [17, 25] : [16, 24];
  return (
    <AppText
      color={color}
      style={[
        scaledText(size, line, scale),
        (bold || big) && { fontWeight: '700' },
        semi && { fontWeight: '600' },
        italic && { fontStyle: 'italic' },
        style,
      ]}
    >
      {children}
    </AppText>
  );
}

function Section({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionIcon, { backgroundColor: tint(color, '1F') }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <AppText variant="subheading">{title}</AppText>
      </View>
      {children}
    </View>
  );
}

export function ExpressionDetailScreen() {
  const router = useRouter();
  const { expressionId } = useLocalSearchParams<{ expressionId: string }>();
  const persian = useAuthStore((s) => s.profile?.preferredLanguage === 'PR');
  const query = useExpression(expressionId);
  const navigation = useExpressionNavigation(expressionId);
  const bookmark = useToggleExpressionBookmark(expressionId);
  const viewed = useMarkViewed();

  // Opening an expression counts as seeing it: once per expression, failures are ignored.
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (expressionId && query.isSuccess && seen.current !== expressionId) {
      seen.current = expressionId;
      viewed.mutate(expressionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expressionId, query.isSuccess]);

  const goTo = (id: string) =>
    router.replace({ pathname: '/expressions/[expressionId]', params: { expressionId: id } });

  if (query.isPending) {
    return (
      <Screen>
        <Header title="Wendung" back />
        <View accessibilityLabel="Wendung wird geladen" style={{ gap: spacing.md }}>
          <Skeleton width="70%" height={32} />
          <Card style={{ gap: spacing.sm }}>
            <Skeleton height={16} />
            <Skeleton height={16} />
          </Card>
        </View>
      </Screen>
    );
  }
  const e = query.data;
  if (query.isError || !e) {
    return (
      <Screen>
        <Header title="Wendung" back />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const image = e.type === 'REDEWENDUNG' ? resolveUploadUrl(e.imageUrl) : null;
  const prev = navigation.data?.previous;
  const next = navigation.data?.next;
  const nav = (prev || next) && (
    <View style={styles.navRow}>
      <View style={styles.flex}>
        {prev ? (
          <Button
            label="‹ Vorherige"
            variant="secondary"
            accessibilityHint={prev.expression}
            onPress={() => goTo(prev.id)}
            color={EXPRESSION_DARK}
          />
        ) : null}
      </View>
      <View style={styles.flex}>
        {next ? (
          <Button
            label="Nächste ›"
            variant="secondary"
            accessibilityHint={next.expression}
            onPress={() => goTo(next.id)}
            color={EXPRESSION_DARK}
          />
        ) : null}
      </View>
    </View>
  );

  const color = TYPE_COLOR[e.type];
  const hasWordPair = e.type === 'REDEWENDUNG' && (e.literalMeaning || e.figurativeMeaning);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ExpressionHero
          accent={color}
          chip={`${TYPE_EMOJI[e.type]} ${TYPE_SINGULAR[e.type].toUpperCase()} · ${e.level}`}
          title={e.expression}
          trailing={
            <IconButton
              name={e.bookmarked ? 'star' : 'star-outline'}
              label={e.bookmarked ? 'Gemerkt' : 'Merken'}
              color={e.bookmarked ? colors.warning : colors.ink}
              busy={bookmark.isPending}
              onPress={() => bookmark.mutate(e.bookmarked)}
            />
          }
        >
          <View style={styles.heroMeta}>
            {e.register ? <Badge label={REGISTER_LABEL[e.register]} /> : null}
            {e.progress ? <MasteryDots level={e.progress.masteryLevel} /> : null}
          </View>
        </ExpressionHero>

        <View style={styles.block}>
          {image ? (
            <Image
              source={{ uri: image }}
              contentFit="cover"
              style={styles.image}
              accessibilityLabel={`Illustration: ${e.expression}`}
            />
          ) : null}

          <View style={styles.actions}>
            <View style={styles.flex}>
              <Button
                pill
                label="Üben"
                onPress={() =>
                  router.push({
                    pathname: '/expressions/practice',
                    params: { expressionId: e.id, skipIntro: '1' },
                  })
                }
                color={EXPRESSION_COLOR}
              />
            </View>
            <View style={styles.flex}>
              <Button
                pill
                label={e.bookmarked ? '★ Gemerkt' : '☆ Merken'}
                variant="secondary"
                loading={bookmark.isPending}
                onPress={() => bookmark.mutate(e.bookmarked)}
                color={EXPRESSION_DARK}
              />
            </View>
          </View>
          {bookmark.error ? <ErrorNotice error={bookmark.error} /> : null}

          <View style={styles.sizeRow}>
            <AppText variant="small" color={colors.mutedForeground} style={{ fontWeight: '600' }}>
              Schriftgröße
            </AppText>
            <TextSizeControl color={EXPRESSION_COLOR} dark={EXPRESSION_DARK} />
          </View>

          <Section title="Bedeutung" icon="bulb-outline" color={color}>
            <Body big>{e.meaningDe}</Body>
            {e.meaningEn ? <Body color={colors.mutedForeground}>🇬🇧 {e.meaningEn}</Body> : null}
            {persian && e.meaningFa ? (
              <Body color={colors.mutedForeground} style={styles.rtl}>
                🇮🇷 {e.meaningFa}
              </Body>
            ) : null}
          </Section>

          {hasWordPair ? (
            <WordPair literal={e.literalMeaning} figurative={e.figurativeMeaning} color={color} />
          ) : null}

          {e.patterns.length > 0 ? (
            <Section title="Muster" icon="construct-outline" color={color}>
              {e.patterns.map((p) => (
                <View key={p.id} style={[styles.pattern, { borderLeftColor: color }]}>
                  <Body bold>{p.pattern}</Body>
                  <View style={styles.tags}>
                    {p.grammarCase ? (
                      <Badge tone="primary" label={`Kasus: ${p.grammarCase}`} />
                    ) : null}
                    {p.preposition ? <Badge label={`Präposition: ${p.preposition}`} /> : null}
                  </View>
                  {p.example ? <Body italic>„{p.example}“</Body> : null}
                </View>
              ))}
            </Section>
          ) : null}

          {e.examples.length > 0 ? (
            <Section title="Beispiele" icon="chatbubbles-outline" color={color}>
              {e.examples.map((x) => (
                <View key={x.id} style={styles.bubble}>
                  <Body semi>„{x.sentence}“</Body>
                  {persian && x.translationFa ? (
                    <Body small color={colors.mutedForeground} style={styles.rtl}>
                      {x.translationFa}
                    </Body>
                  ) : x.translationEn ? (
                    <Body small color={colors.mutedForeground}>
                      {x.translationEn}
                    </Body>
                  ) : null}
                  <Badge tone="primary" label={CONTEXT_LABEL[x.context] ?? x.context} />
                </View>
              ))}
            </Section>
          ) : null}

          {e.grammarNote ? (
            <Section title="Grammatik" icon="school-outline" color={color}>
              <Body>{e.grammarNote}</Body>
            </Section>
          ) : null}
          {e.usageNote ? (
            <Section title="Verwendung" icon="information-circle-outline" color={color}>
              <Body>{e.usageNote}</Body>
            </Section>
          ) : null}
          {e.commonMistakes ? (
            <View style={styles.mistakes}>
              <View style={styles.sectionHead}>
                <Ionicons name="warning-outline" size={20} color={colors.warning} />
                <AppText variant="subheading">Häufige Fehler</AppText>
              </View>
              <Body>{e.commonMistakes}</Body>
            </View>
          ) : null}

          {e.progress && e.progress.reviewCount > 0 ? (
            <Section title="Dein Fortschritt" icon="trending-up-outline" color={color}>
              <MasteryPath level={e.progress.masteryLevel} />
              <ProgressBar
                value={Math.round(e.progress.overallScore * 100)}
                label="Gesamtfortschritt"
                color={EXPRESSION_COLOR}
              />
              <View style={styles.stats}>
                <StatPill
                  icon="checkmark-circle"
                  color={colors.success}
                  text={`${e.progress.correctCount} richtig`}
                />
                <StatPill
                  icon="close-circle"
                  color={colors.destructive}
                  text={`${e.progress.incorrectCount} falsch`}
                />
                <StatPill
                  icon="repeat"
                  color={EXPRESSION_COLOR}
                  text={`${e.progress.reviewCount}× geübt`}
                />
              </View>
            </Section>
          ) : null}

          {nav}
        </View>
      </ScrollView>
    </View>
  );
}

/** Wörtlich ⇄ Übertragen: tap a tab to see the picture meaning or the real meaning. */
function WordPair({
  literal,
  figurative,
  color,
}: {
  literal: string;
  figurative: string;
  color: string;
}) {
  const tabs = [
    literal ? { key: 'literal', label: 'Wörtlich', emoji: '🖼️', text: literal } : null,
    figurative ? { key: 'figurative', label: 'Übertragen', emoji: '💡', text: figurative } : null,
  ].filter((t): t is NonNullable<typeof t> => t !== null);
  const [active, setActive] = useState(tabs[tabs.length - 1].key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <Section title="Wörtlich und übertragen" icon="swap-horizontal-outline" color={color}>
      {tabs.length > 1 ? (
        <View style={styles.segment}>
          {tabs.map((t) => {
            const on = t.key === current.key;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="button"
                accessibilityLabel={t.label}
                accessibilityState={{ selected: on }}
                onPress={() => setActive(t.key)}
                style={[styles.segBtn, on && { backgroundColor: color }]}
              >
                <AppText
                  variant="small"
                  color={on ? '#FFFFFF' : colors.ink}
                  style={{ fontWeight: '700' }}
                >
                  {t.emoji} {t.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View style={[styles.flip, { backgroundColor: tint(color, '14') }]}>
        <AppText variant="caption" color={color} style={{ fontWeight: '800' }}>
          {current.label.toUpperCase()}
        </AppText>
        <Body big>{current.text}</Body>
      </View>
    </Section>
  );
}

function StatPill({
  icon,
  color,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  text: string;
}) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={16} color={color} />
      <AppText variant="small" style={{ fontWeight: '600' }}>
        {text}
      </AppText>
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
    gap: spacing.md,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  navRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  image: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: colors.muted },
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
  sizeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bold: { fontWeight: '700' },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pattern: { gap: spacing.xs, paddingLeft: spacing.md, borderLeftWidth: 4 },
  bubble: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderTopLeftRadius: 6,
    backgroundColor: tint(EXPRESSION_COLOR, '1F'),
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
  },
  segBtn: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  flip: { gap: spacing.xs, padding: spacing.lg, borderRadius: radius.lg },
  mistakes: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warningSoft,
  },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
