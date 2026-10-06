import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { AppText } from '@/components/ui';
import { IconButton, tint } from '@/features/exam/components/kit';
import { colors, radius, spacing } from '@/theme';
import type { RedemittelStatus } from '@/types/redemittel';
import { REDEMITTEL_COLOR, STATUS_COLOR, STATUS_LABELS, STATUS_STEP } from '../meta';

/** A speech bubble with quote marks and a helper bubble — decoration only. */
export function PhraseIllustration({ size = 108 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size * 0.85 }} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 140 120">
        <Circle cx="70" cy="62" r="52" fill="#FFFFFF" fillOpacity={0.4} />
        <Path d="M118 12l2.5 5.5 5.5 2.5-5.5 2.5-2.5 5.5-2.5-5.5-5.5-2.5 5.5-2.5z" fill="#FFC53D" />
        <Circle cx="14" cy="92" r="4" fill="#FFFFFF" fillOpacity={0.7} />
        <G>
          <Rect x="12" y="20" width="84" height="58" rx="18" fill={REDEMITTEL_COLOR} />
          <Path d="M30 76l-8 18 26-14z" fill={REDEMITTEL_COLOR} />
          <Path
            d="M32 40q0-8 8-8v5q-3 0-3 3h3v10h-10zM56 40q0-8 8-8v5q-3 0-3 3h3v10h-10z"
            fill="#FFFFFF"
          />
          <Rect x="32" y="58" width="48" height="5" rx="2.5" fill="#FFFFFF" fillOpacity={0.65} />
        </G>
        <G>
          <Rect
            x="62"
            y="56"
            width="68"
            height="44"
            rx="14"
            fill="#FFFFFF"
            stroke={REDEMITTEL_COLOR}
            strokeWidth="3"
          />
          <Rect x="74" y="68" width="44" height="6" rx="3" fill="#F8C9D9" />
          <Rect x="74" y="80" width="28" height="6" rx="3" fill="#FCE3EC" />
        </G>
      </Svg>
    </View>
  );
}

/** Tinted rounded hero shared by the Redemittel screens. */
export function RedemittelHero({
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
  return (
    <View style={[styles.hero, { backgroundColor: tint(REDEMITTEL_COLOR, '1F') }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.topRow}>
          <IconButton name="arrow-back" label="Zurück" onPress={() => router.back()} />
          {trailing ?? (
            <View style={[styles.chip, { backgroundColor: tint(REDEMITTEL_COLOR, '33') }]}>
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
                  { backgroundColor: tint(REDEMITTEL_COLOR, '33'), alignSelf: 'flex-start' },
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

/** Progress as three small segments plus the status in words, so it is never colour alone. */
export function StatusStepper({ status }: { status: RedemittelStatus }) {
  const step = STATUS_STEP[status];
  const color = STATUS_COLOR[status];
  return (
    <View style={styles.stepper} accessible accessibilityLabel={`Status: ${STATUS_LABELS[status]}`}>
      <View style={styles.segments}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.segment, i < step && { backgroundColor: color }]} />
        ))}
      </View>
      <View style={styles.statusText}>
        {status === 'MASTERED' ? (
          <Ionicons name="checkmark-circle" size={14} color={color} />
        ) : null}
        <AppText variant="caption" color={color} style={{ fontWeight: '800' }}>
          {STATUS_LABELS[status]}
        </AppText>
      </View>
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
    paddingRight: spacing.sm,
  },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { width: 18, height: 6, borderRadius: 3, backgroundColor: colors.secondary },
  statusText: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
