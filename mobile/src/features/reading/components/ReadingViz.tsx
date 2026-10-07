import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { AppText } from '@/components/ui';
import { HeroBackdrop } from '@/components/ui/HeroDecor';
import { IconButton, tint } from '@/features/exam/components/kit';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

/** Accent for everything reading: a soft violet, matching the Lesen tile in the learn tab. */
export const READING_COLOR = '#8B5CF6';
/** Darker shade for text and icons on the light violet tint. */
export const READING_DARK = '#6034C9';

/** An open book with a magnifier — decoration only. */
export function BookIllustration({ size = 112 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size * 0.85 }} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 140 120">
        <Circle cx="70" cy="62" r="52" fill="#FFFFFF" fillOpacity={0.4} />
        <Path d="M116 12l2.5 5.5 5.5 2.5-5.5 2.5-2.5 5.5-2.5-5.5-5.5-2.5 5.5-2.5z" fill="#FFC53D" />
        <Circle cx="14" cy="90" r="4" fill="#FFFFFF" fillOpacity={0.7} />
        <G>
          <Path
            d="M20 34q24-8 46 4v58q-22-12-46-4z"
            fill="#FFFFFF"
            stroke={READING_COLOR}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <Path
            d="M66 38q22-12 46-4v58q-24-8-46 4z"
            fill="#F3EDFF"
            stroke={READING_COLOR}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <Rect x="28" y="46" width="28" height="4" rx="2" fill="#D9CBFA" />
          <Rect x="28" y="56" width="22" height="4" rx="2" fill="#E8DFFC" />
          <Rect x="28" y="66" width="26" height="4" rx="2" fill="#E8DFFC" />
          <Rect x="76" y="46" width="14" height="6" rx="3" fill="#FFD166" />
          <Rect x="92" y="46" width="12" height="6" rx="3" fill="#D9CBFA" />
          <Rect x="76" y="58" width="26" height="4" rx="2" fill="#D9CBFA" />
          <Rect x="76" y="68" width="20" height="4" rx="2" fill="#D9CBFA" />
        </G>
        <G>
          <Circle
            cx="104"
            cy="84"
            r="14"
            fill="#FFFFFF"
            fillOpacity={0.9}
            stroke="#1E5FB8"
            strokeWidth="4"
          />
          <Path d="M114 94l12 12" stroke="#1E5FB8" strokeWidth="5" strokeLinecap="round" />
        </G>
      </Svg>
    </View>
  );
}

/** Tinted rounded hero shared by the reading screens. */
export function ReadingHero({
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
    <View style={[styles.hero, { backgroundColor: tint(READING_COLOR, '1F') }]}>
      <HeroBackdrop color={READING_COLOR} />
      <SafeAreaView edges={['top']}>
        <View style={styles.topRow}>
          <IconButton name="arrow-back" label={t.common.back} onPress={() => router.back()} />
          {trailing ?? (
            <View style={[styles.chip, { backgroundColor: tint(READING_COLOR, '33') }]}>
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
                  { backgroundColor: tint(READING_COLOR, '33'), alignSelf: 'flex-start' },
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

/** Small pill with an icon, e.g. "3 new words". */
export function InfoPill({
  icon,
  text,
  color = colors.primaryDark,
  background = colors.accent,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
  color?: string;
  background?: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      {icon ? <Ionicons name={icon} size={13} color={color} /> : null}
      <AppText variant="caption" color={color} style={{ fontWeight: '700' }}>
        {text}
      </AppText>
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
    paddingEnd: spacing.sm,
  },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.ink },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
});
