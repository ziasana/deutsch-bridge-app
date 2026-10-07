import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { IconButton, tint } from '@/features/exam/components/kit';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';
import type { DailyWord } from '@/types/dailyWord';

/** Warm morning amber: today's words are a "sunrise" habit. */
export const DAILY_COLOR = '#F59E0B';

/** A sun rising over a flash card — decoration only. */
export function SunriseIllustration({ size = 108 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size * 0.85 }} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 140 120">
        <Circle cx="70" cy="66" r="50" fill="#FFFFFF" fillOpacity={0.4} />
        <G>
          <Circle cx="70" cy="52" r="22" fill="#FFC53D" />
          <Path
            d="M70 18v8M70 86v-4M36 52h8M96 52h8M46 28l6 6M94 28l-6 6"
            stroke="#F59E0B"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </G>
        <G>
          <Rect
            x="30"
            y="64"
            width="80"
            height="44"
            rx="12"
            fill="#FFFFFF"
            stroke="#F59E0B"
            strokeWidth="3"
          />
          <Rect x="42" y="78" width="40" height="6" rx="3" fill="#FCE3B0" />
          <Rect x="42" y="90" width="26" height="5" rx="2.5" fill="#FEF0D2" />
          <Circle cx="96" cy="86" r="8" fill="#27AE7A" />
          <Path
            d="M92.5 86l2.5 2.5 4-5"
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

/** Tinted rounded hero for the daily words flow. */
export function DailyHero({
  chip,
  title,
  subtitle,
  right,
  children,
}: {
  chip: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <View style={[styles.hero, { backgroundColor: tint(DAILY_COLOR, '1F') }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.topRow}>
          <IconButton name="arrow-back" label={t.common.back} onPress={() => router.back()} />
          <View style={[styles.chip, { backgroundColor: tint(DAILY_COLOR, '33') }]}>
            <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
              {chip}
            </AppText>
          </View>
        </View>
        <View style={styles.heroMain}>
          <View style={{ flex: 1, gap: spacing.xs }}>
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

/** One numbered step per word: green when learned, outlined when current. Tap to jump. */
export function WordStepper({
  words,
  current,
  onJump,
}: {
  words: DailyWord[];
  current: number;
  onJump: (index: number) => void;
}) {
  const { t } = useI18n();
  return (
    <View style={styles.stepper}>
      {words.map((w, i) => {
        const on = i === current;
        return (
          <View key={w.id} style={styles.stepWrap}>
            {i > 0 ? (
              <View
                style={[
                  styles.stepLine,
                  words[i - 1].learned && { backgroundColor: colors.success },
                ]}
              />
            ) : (
              <View style={styles.stepLine} />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.daily.stepper(i + 1, w.learned)}
              accessibilityState={{ selected: on }}
              onPress={() => onJump(i)}
              hitSlop={spacing.xs}
              style={[
                styles.step,
                w.learned && { backgroundColor: colors.success, borderColor: colors.success },
                on &&
                  !w.learned && {
                    borderColor: DAILY_COLOR,
                    backgroundColor: tint(DAILY_COLOR, '1F'),
                  },
                on && { transform: [{ scale: 1.12 }] },
              ]}
            >
              {w.learned ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <AppText
                  variant="small"
                  color={on ? '#B26B00' : colors.mutedForeground}
                  style={{ fontWeight: '800' }}
                >
                  {i + 1}
                </AppText>
              )}
            </Pressable>
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
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepLine: { flex: 1, height: 3, backgroundColor: colors.border },
  step: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
