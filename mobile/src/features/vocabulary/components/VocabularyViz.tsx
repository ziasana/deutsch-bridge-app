import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { AppText } from '@/components/ui';
import { IconButton, tint } from '@/features/exam/components/kit';
import { colors, radius, spacing } from '@/theme';
import type { VocabularyMasteryLevel } from '@/types/vocabulary';
import { MASTERY_COLOR, MASTERY_ORDER } from '../listLogic';
import { useI18n } from '@/i18n';

/** Two stacked flash cards with an "A" and a tick — decoration only. */
export function CardsIllustration({ size = 112 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size * 0.85 }} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 140 120">
        <Circle cx="70" cy="62" r="52" fill="#FFFFFF" fillOpacity={0.4} />
        <Path d="M118 12l2.5 5.5 5.5 2.5-5.5 2.5-2.5 5.5-2.5-5.5-5.5-2.5 5.5-2.5z" fill="#FFC53D" />
        <Circle cx="14" cy="90" r="4" fill="#FFFFFF" fillOpacity={0.7} />
        <G rotation={-10} origin="60, 64">
          <Rect x="26" y="26" width="72" height="62" rx="12" fill="#C9DEFF" />
        </G>
        <G rotation={6} origin="76, 64">
          <Rect
            x="40"
            y="22"
            width="74"
            height="66"
            rx="12"
            fill="#FFFFFF"
            stroke="#4D94FF"
            strokeWidth="3"
          />
          <Path
            d="M64 70l7-22 7 22M66.5 63h9"
            stroke="#4D94FF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Rect x="56" y="76" width="40" height="5" rx="2.5" fill="#E2EBF6" />
          <Circle cx="104" cy="34" r="9" fill="#27AE7A" />
          <Path
            d="M100 34l3 3 5-6"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}

/** Tinted rounded hero shared by the vocabulary screens. */
export function VocabularyHero({
  chip,
  title,
  subtitle,
  right,
  trailing,
  children,
}: {
  chip: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <View style={[styles.hero, { backgroundColor: tint(colors.primary, '1F') }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.topRow}>
          <IconButton name="arrow-back" label={t.common.back} onPress={() => router.back()} />
          {trailing ?? (
            <View style={[styles.chip, { backgroundColor: tint(colors.primary, '33') }]}>
              <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
                {chip}
              </AppText>
            </View>
          )}
        </View>
        <View style={styles.heroMain}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            {trailing ? (
              <View
                style={[
                  styles.chip,
                  { backgroundColor: tint(colors.primary, '33'), alignSelf: 'flex-start' },
                ]}
              >
                <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
                  {chip}
                </AppText>
              </View>
            ) : null}
            <AppText style={styles.title} accessibilityRole="header">
              {title}
            </AppText>
            {subtitle ? (
              <AppText color={colors.ink} style={{ fontWeight: '500' }}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {right}
        </View>
        {children}
      </SafeAreaView>
    </View>
  );
}

/** Four dots filling up with the mastery level. */
export function MasteryDots({
  level,
  showLabel = true,
}: {
  level: VocabularyMasteryLevel;
  showLabel?: boolean;
}) {
  const { t } = useI18n();
  const label = t.vocabulary.mastery[level];
  const filled = MASTERY_ORDER.indexOf(level) + 1;
  const color = MASTERY_COLOR[level];
  return (
    <View style={styles.dotsRow} accessible accessibilityLabel={t.vocabulary.state(label)}>
      <View style={styles.dots}>
        {MASTERY_ORDER.map((m, i) => (
          <View
            key={m}
            style={[styles.dot, { backgroundColor: i < filled ? color : colors.secondary }]}
          />
        ))}
      </View>
      {showLabel ? (
        <AppText variant="caption" color={color} style={{ fontWeight: '800' }}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

/** One stacked bar showing how the words split across the mastery steps. */
export function MasteryBar({ counts }: { counts: Record<VocabularyMasteryLevel, number> }) {
  const total = MASTERY_ORDER.reduce((sum, m) => sum + counts[m], 0);
  return (
    <View
      style={styles.bar}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {total === 0
        ? null
        : MASTERY_ORDER.map((m) =>
            counts[m] > 0 ? (
              <View key={m} style={{ flex: counts[m], backgroundColor: MASTERY_COLOR[m] }} />
            ) : null,
          )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingEnd: spacing.sm,
  },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.ink },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
});
