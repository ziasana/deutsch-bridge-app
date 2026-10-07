import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { AppText } from '@/components/ui';
import { HeroBackdrop } from '@/components/ui/HeroDecor';
import { IconButton, tint } from '@/features/exam/components/kit';
import { colors, radius, spacing } from '@/theme';
import type { ExpressionMasteryLevel } from '@/types/expression';
import { EXPRESSION_COLOR, MASTERY_COLOR, MASTERY_LABEL, MASTERY_ORDER } from '../labels';

/** Two overlapping speech bubbles with quote marks — decoration only. */
export function BubblesIllustration({ size = 120 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size * 0.85 }} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 140 120">
        <Circle cx="70" cy="62" r="52" fill="#FFFFFF" fillOpacity={0.35} />
        <Path d="M118 14l2.5 5.5 5.5 2.5-5.5 2.5-2.5 5.5-2.5-5.5-5.5-2.5 5.5-2.5z" fill="#FFC53D" />
        <Circle cx="14" cy="92" r="4" fill="#FFFFFF" fillOpacity={0.7} />
        <G>
          <Rect x="10" y="24" width="76" height="52" rx="16" fill="#4D94FF" />
          <Path d="M26 74l-6 16 22-14z" fill="#4D94FF" />
          <Path
            d="M34 40q0-6 6-6v4q-3 0-3 3h3v8h-8zM52 40q0-6 6-6v4q-3 0-3 3h3v8h-8z"
            fill="#FFFFFF"
          />
          <Rect x="34" y="56" width="42" height="5" rx="2.5" fill="#FFFFFF" fillOpacity={0.6} />
        </G>
        <G>
          <Rect
            x="58"
            y="52"
            width="72"
            height="50"
            rx="16"
            fill="#FFFFFF"
            stroke="#4D94FF"
            strokeWidth="3"
          />
          <Path
            d="M110 100l8 14-22-10z"
            fill="#FFFFFF"
            stroke="#4D94FF"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <Rect x="70" y="66" width="46" height="6" rx="3" fill="#C9D9EE" />
          <Rect x="70" y="78" width="30" height="6" rx="3" fill="#E2EBF6" />
          <Circle cx="112" cy="81" r="7" fill="#27AE7A" />
          <Path
            d="M108.5 81l2.5 2.5 4-5"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}

/** Tinted rounded hero shared by the expression screens: back button, chip, title and a right-hand slot. */
export function ExpressionHero({
  chip,
  title,
  subtitle,
  right,
  accent = EXPRESSION_COLOR,
  trailing,
  children,
}: {
  chip: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  accent?: string;
  /** Top-right action (e.g. the bookmark star). */
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={[styles.hero, { backgroundColor: tint(accent, '1F') }]}>
      <HeroBackdrop color={accent} />
      <SafeAreaView edges={['top']}>
        <View style={styles.topRow}>
          <IconButton name="arrow-back" label="Zurück" onPress={() => router.back()} />
          {trailing ?? (
            <View style={[styles.chip, { backgroundColor: tint(accent, '33') }]}>
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
                  { backgroundColor: tint(accent, '33'), alignSelf: 'flex-start' },
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

/** Five dots filling up with the mastery level, coloured by step. */
export function MasteryDots({
  level,
  showLabel = true,
}: {
  level: ExpressionMasteryLevel;
  showLabel?: boolean;
}) {
  const filled = MASTERY_ORDER.indexOf(level) + 1;
  const color = MASTERY_COLOR[level];
  return (
    <View style={styles.dotsRow} accessible accessibilityLabel={`Stand: ${MASTERY_LABEL[level]}`}>
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
          {MASTERY_LABEL[level]}
        </AppText>
      ) : null}
    </View>
  );
}

/** Mastery path: five labelled steps with the current one highlighted. */
export function MasteryPath({ level }: { level: ExpressionMasteryLevel }) {
  const current = MASTERY_ORDER.indexOf(level);
  return (
    <View style={styles.path}>
      {MASTERY_ORDER.map((m, i) => {
        const done = i <= current;
        return (
          <View key={m} style={styles.pathStep}>
            <View style={styles.pathLineRow}>
              <View
                style={[
                  styles.pathLine,
                  i > 0 && { backgroundColor: done ? MASTERY_COLOR[level] : colors.border },
                ]}
              />
              <View
                style={[
                  styles.pathNode,
                  done
                    ? { backgroundColor: MASTERY_COLOR[level], borderColor: MASTERY_COLOR[level] }
                    : { borderColor: colors.border },
                ]}
              >
                {done ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
              </View>
              <View
                style={[
                  styles.pathLine,
                  i < MASTERY_ORDER.length - 1 && {
                    backgroundColor: i < current ? MASTERY_COLOR[level] : colors.border,
                  },
                ]}
              />
            </View>
            <AppText
              variant="caption"
              center
              color={i === current ? MASTERY_COLOR[level] : colors.mutedForeground}
              style={{ fontWeight: i === current ? '800' : '500' }}
              numberOfLines={1}
            >
              {MASTERY_LABEL[m]}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.ink },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  path: { flexDirection: 'row' },
  pathStep: { flex: 1, alignItems: 'center', gap: 4 },
  pathLineRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  pathLine: { flex: 1, height: 3, backgroundColor: 'transparent' },
  pathNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
