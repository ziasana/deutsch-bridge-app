import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, ErrorState, Skeleton } from '@/components/ui';
import { PressableScale, StatTile, tint } from '@/features/exam/components/kit';
import { colors, radius, shadow, spacing } from '@/theme';
import type { ExpressionListItem, ExpressionType } from '@/types/expression';
import { BubblesIllustration, ExpressionHero, MasteryDots } from './components/ExpressionViz';
import { useCollectionSummary, useContinueLearning } from './hooks';
import {
  EXPRESSION_COLOR,
  EXPRESSION_DARK,
  MASTERY_COLOR,
  TYPE_COLOR,
  TYPE_DESCRIPTION,
  TYPE_EMOJI,
  TYPE_LABEL,
} from './labels';
import { meaningLine } from './practiceLogic';

const TYPES: ExpressionType[] = ['REDEWENDUNG', 'NOMEN_VERB_VERBINDUNG'];

/** A compact flash card in the "continue learning" carousel. */
function MiniCard({ item, onPress }: { item: ExpressionListItem; onPress: () => void }) {
  const color = MASTERY_COLOR[item.masteryLevel];
  const meaning = meaningLine(item.meaningDe, item.meaningEn);
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${item.expression}${meaning ? `, ${meaning}` : ''}`}
      onPress={onPress}
      style={[styles.mini, { borderTopColor: color }]}
    >
      <View style={styles.miniTop}>
        <View style={styles.level}>
          <AppText variant="caption" color={EXPRESSION_DARK} style={{ fontWeight: '800' }}>
            {item.level}
          </AppText>
        </View>
        <MasteryDots level={item.masteryLevel} showLabel={false} />
      </View>
      <AppText variant="subheading" numberOfLines={3}>
        {item.expression}
      </AppText>
      {meaning ? (
        <AppText variant="small" color={colors.mutedForeground} numberOfLines={2}>
          {meaning}
        </AppText>
      ) : null}
    </PressableScale>
  );
}

function CollectionCard({ type, total }: { type: ExpressionType; total: number | undefined }) {
  const router = useRouter();
  const cont = useContinueLearning(type);
  const ready = cont.data?.readyCount ?? 0;
  const color = TYPE_COLOR[type];
  return (
    <View style={styles.collection}>
      <View style={styles.collectionHead}>
        <View style={[styles.emojiTile, { backgroundColor: tint(color, '1F') }]}>
          <AppText style={{ fontSize: 28, lineHeight: 36 }} accessibilityElementsHidden>
            {TYPE_EMOJI[type]}
          </AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="heading">{TYPE_LABEL[type]}</AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            {TYPE_DESCRIPTION[type]}
          </AppText>
        </View>
      </View>

      <View style={styles.countRow}>
        <Ionicons name="albums-outline" size={16} color={color} />
        <AppText variant="small" color={colors.ink} style={{ fontWeight: '600' }}>
          {total === undefined ? '…' : `${total} Einträge`}
          {ready > 0 ? ` · ${ready} bereit zum Üben` : ''}
        </AppText>
      </View>

      {cont.data && cont.data.items.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="caption" color={color} style={{ fontWeight: '800' }}>
            WEITER LERNEN
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.minis}
            style={styles.minisBleed}
          >
            {cont.data.items.slice(0, 5).map((item) => (
              <MiniCard
                key={item.id}
                item={item}
                onPress={() =>
                  router.push({
                    pathname: '/expressions/[expressionId]',
                    params: { expressionId: item.id },
                  })
                }
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Button
        pill
        label={`${TYPE_LABEL[type]} ansehen`}
        variant="secondary"
        onPress={() => router.push({ pathname: '/expressions/list/[type]', params: { type } })}
        color={EXPRESSION_DARK}
      />
    </View>
  );
}

export function ExpressionsHubScreen() {
  const router = useRouter();
  const summary = useCollectionSummary();
  const totalOf = (type: ExpressionType) => summary.data?.find((s) => s.type === type)?.total;
  const grandTotal = summary.data?.reduce((sum, s) => sum + s.total, 0) ?? 0;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ExpressionHero
          chip="💬 AKTIVER WORTSCHATZ"
          title="Active Expressions"
          subtitle="Wendungen sicher im Alltag und in der Prüfung einsetzen"
          right={<BubblesIllustration size={118} />}
        />

        <View style={styles.body}>
          {summary.isPending ? (
            <View accessibilityLabel="Sammlungen werden geladen" style={{ gap: spacing.md }}>
              <Skeleton height={110} />
              <Skeleton height={200} />
            </View>
          ) : summary.isError ? (
            <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
          ) : (
            <>
              <View style={styles.tiles}>
                <StatTile
                  icon="albums-outline"
                  label="Einträge"
                  value={String(grandTotal)}
                  color={EXPRESSION_COLOR}
                />
                {TYPES.map((type) => (
                  <StatTile
                    key={type}
                    icon={type === 'REDEWENDUNG' ? 'chatbubble-ellipses-outline' : 'link-outline'}
                    label={type === 'REDEWENDUNG' ? 'Redewendungen' : 'Verbindungen'}
                    value={String(totalOf(type) ?? 0)}
                    color={TYPE_COLOR[type]}
                  />
                ))}
              </View>

              <View style={styles.training}>
                <View style={{ flex: 1, gap: 4 }}>
                  <AppText style={styles.trainingTitle}>🎯 Training</AppText>
                  <AppText variant="small" color="#FFFFFFE6">
                    Üben mit Lücken, Kontextfragen und eigenen Sätzen. Fällige Wendungen kommen
                    zuerst.
                  </AppText>
                </View>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel="Training starten"
                  onPress={() => router.push('/expressions/practice')}
                  style={styles.trainingBtn}
                >
                  <Ionicons name="play" size={18} color={EXPRESSION_DARK} />
                  <AppText variant="small" color={EXPRESSION_DARK} style={{ fontWeight: '800' }}>
                    Starten
                  </AppText>
                </PressableScale>
              </View>

              {TYPES.map((type) => (
                <CollectionCard key={type} type={type} total={totalOf(type)} />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.lg },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  training: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: EXPRESSION_COLOR,
    ...shadow.card,
  },
  trainingTitle: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: '#FFFFFF' },
  trainingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
  },
  collection: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  collectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emojiTile: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  minisBleed: { marginHorizontal: -spacing.lg },
  minis: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  mini: {
    width: 190,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderTopWidth: 4,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  miniTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  level: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: tint(EXPRESSION_COLOR, '1F'),
  },
});
