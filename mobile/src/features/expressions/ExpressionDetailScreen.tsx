import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import { resolveUploadUrl } from '@/utils/urls';
import {
  useExpression,
  useExpressionNavigation,
  useMarkViewed,
  useToggleExpressionBookmark,
} from './hooks';
import { CONTEXT_LABEL, MASTERY_LABEL, REGISTER_LABEL, TYPE_SINGULAR } from './labels';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ gap: spacing.sm }}>
      <AppText variant="subheading">{title}</AppText>
      {children}
    </Card>
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
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <Screen>
      <Header title={e.expression} subtitle={e.meaningDe} back />
      <View style={styles.meta}>
        <Badge tone="primary" label={e.level} />
        <Badge label={TYPE_SINGULAR[e.type]} />
        {e.register ? <Badge label={REGISTER_LABEL[e.register]} /> : null}
        {e.progress ? (
          <Badge tone="success" label={MASTERY_LABEL[e.progress.masteryLevel]} />
        ) : null}
      </View>

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
            label="Üben"
            onPress={() =>
              router.push({
                pathname: '/expressions/practice',
                params: { expressionId: e.id, skipIntro: '1' },
              })
            }
          />
        </View>
        <View style={styles.flex}>
          <Button
            label={e.bookmarked ? '★ Gemerkt' : '☆ Merken'}
            variant="secondary"
            loading={bookmark.isPending}
            onPress={() => bookmark.mutate(e.bookmarked)}
          />
        </View>
      </View>
      {bookmark.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {bookmark.error.message}
        </AppText>
      ) : null}

      {nav}

      <Section title="Bedeutung">
        <AppText>{e.meaningDe}</AppText>
        {e.meaningEn ? <AppText color={colors.mutedForeground}>🇬🇧 {e.meaningEn}</AppText> : null}
        {persian && e.meaningFa ? (
          <AppText color={colors.mutedForeground} style={styles.rtl}>
            🇮🇷 {e.meaningFa}
          </AppText>
        ) : null}
      </Section>

      {e.type === 'REDEWENDUNG' && (e.literalMeaning || e.figurativeMeaning) ? (
        <Section title="Wörtlich und übertragen">
          {e.literalMeaning ? (
            <AppText>
              <AppText style={styles.bold}>Wörtlich: </AppText>
              {e.literalMeaning}
            </AppText>
          ) : null}
          {e.figurativeMeaning ? (
            <AppText>
              <AppText style={styles.bold}>Übertragen: </AppText>
              {e.figurativeMeaning}
            </AppText>
          ) : null}
        </Section>
      ) : null}

      {e.patterns.length > 0 ? (
        <Section title="Muster">
          {e.patterns.map((p) => (
            <View key={p.id} style={styles.pattern}>
              <AppText style={styles.bold}>{p.pattern}</AppText>
              <AppText variant="small" color={colors.mutedForeground}>
                {[
                  p.grammarCase && `Kasus: ${p.grammarCase}`,
                  p.preposition && `Präposition: ${p.preposition}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
              {p.example ? <AppText style={{ fontStyle: 'italic' }}>„{p.example}“</AppText> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {e.examples.length > 0 ? (
        <Section title="Beispiele">
          {e.examples.map((x) => (
            <View key={x.id} style={styles.example}>
              <AppText>„{x.sentence}“</AppText>
              {persian && x.translationFa ? (
                <AppText variant="small" color={colors.mutedForeground} style={styles.rtl}>
                  {x.translationFa}
                </AppText>
              ) : x.translationEn ? (
                <AppText variant="small" color={colors.mutedForeground}>
                  {x.translationEn}
                </AppText>
              ) : null}
              <Badge label={CONTEXT_LABEL[x.context] ?? x.context} />
            </View>
          ))}
        </Section>
      ) : null}

      {e.grammarNote ? (
        <Section title="Grammatik">
          <AppText>{e.grammarNote}</AppText>
        </Section>
      ) : null}
      {e.usageNote ? (
        <Section title="Verwendung">
          <AppText>{e.usageNote}</AppText>
        </Section>
      ) : null}
      {e.commonMistakes ? (
        <Section title="Häufige Fehler">
          <AppText>{e.commonMistakes}</AppText>
        </Section>
      ) : null}

      {e.progress && e.progress.reviewCount > 0 ? (
        <Section title="Dein Fortschritt">
          <ProgressBar
            value={Math.round(e.progress.overallScore * 100)}
            label="Gesamtfortschritt"
          />
          <AppText variant="small" color={colors.mutedForeground}>
            {e.progress.correctCount} richtig · {e.progress.incorrectCount} falsch ·{' '}
            {e.progress.reviewCount}× geübt
          </AppText>
        </Section>
      ) : null}

      {nav}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  actions: { flexDirection: 'row', gap: spacing.md },
  navRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  image: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.muted },
  bold: { fontWeight: '700' },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  pattern: { gap: 2, paddingBottom: spacing.sm },
  example: { gap: spacing.xs, paddingBottom: spacing.sm },
});
