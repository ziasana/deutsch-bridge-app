import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, DirectionalIcon } from '@/components/ui';
import { useI18n } from '@/i18n';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import { TEXT_SCALES, useExamTextSize } from '../textScale';

/** Section colour at a given opacity (hex alpha), for soft tinted backgrounds. */
export const tint = (color: string, alpha: '14' | '1F' | '33' = '1F') => `${color}${alpha}`;

/**
 * Practice layout: the content scrolls, the primary action stays pinned at the bottom within
 * thumb reach (the main learning-app pattern: one clear next step, always visible).
 */
export function ExerciseFrame({
  children,
  footer,
  header,
  footerTone,
  scrollToEndKey,
  scrollTopKey,
  gap = spacing.lg,
}: {
  children: ReactNode;
  footer?: ReactNode;
  /** Pinned above the scrolling content (progress bars). */
  header?: ReactNode;
  /** Tints the footer, e.g. green / red feedback after an answer. */
  footerTone?: 'success' | 'danger';
  /** Scrolls to the bottom whenever this becomes a new truthy value (e.g. so options stay visible above feedback). */
  scrollToEndKey?: string | null;
  /** Jumps back to the top whenever this changes (e.g. a new question). */
  scrollTopKey?: string;
  gap?: number;
}) {
  const scroller = useRef<ScrollView>(null);
  useEffect(() => {
    if (!scrollToEndKey) return;
    const id = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(id);
  }, [scrollToEndKey]);
  useEffect(() => {
    scroller.current?.scrollTo({ y: 0, animated: false });
  }, [scrollTopKey]);
  return (
    <View style={styles.frame}>
      {header ? <View style={styles.header}>{header}</View> : null}
      <ScrollView
        ref={scroller}
        contentContainerStyle={[styles.scroll, { gap }, !footer && { paddingBottom: spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? (
        <SafeAreaView
          edges={['bottom']}
          style={[
            styles.footerSafe,
            footerTone === 'success' && { backgroundColor: colors.successSoft, borderTopColor: colors.success },
            footerTone === 'danger' && { backgroundColor: colors.destructiveSoft, borderTopColor: colors.destructive },
          ]}
        >
          <View style={styles.footer}>{footer}</View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

/** Pressable that gives a small spring "press-in" so taps feel physical. */
export function PressableScale({
  children,
  style,
  containerStyle,
  scaleTo = 0.97,
  ...rest
}: PressableProps & {
  style?: StyleProp<ViewStyle>;
  /** Style of the animated wrapper (use for flex sizing inside a row). */
  containerStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: ReactNode;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  const spring = (to: number) =>
    Animated.spring(scale, { toValue: to, friction: 7, tension: 240, useNativeDriver: true }).start();
  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <Pressable {...rest} onPressIn={() => spring(scaleTo)} onPressOut={() => spring(1)} style={style}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export type SegmentState = 'correct' | 'wrong' | 'answered' | undefined;

/** One bar per question: green / red once answered, the section colour for the current one. */
export function SegmentedProgress({
  total,
  current,
  states,
  color,
  label = 'Fortschritt der Übung',
}: {
  total: number;
  /** Zero-based index of the current question. */
  current: number;
  states: SegmentState[];
  color: string;
  label?: string;
}) {
  const done = states.filter(Boolean).length;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: done, text: `${done} von ${total}` }}
      style={styles.segments}
    >
      {Array.from({ length: total }, (_, i) => {
        const st = states[i];
        const bg =
          st === 'correct'
            ? colors.success
            : st === 'wrong'
              ? colors.destructive
              : st === 'answered'
                ? color
                : i === current
                  ? tint(color, '33')
                  : colors.muted;
        return (
          <View key={i} style={[styles.segment, { backgroundColor: bg }]}>
            {i === current && !st ? <View style={[styles.segmentNow, { backgroundColor: color }]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

/** Round icon button used in the quiz top bar. */
export function IconButton({
  name,
  label,
  onPress,
  color = colors.ink,
  selected,
  busy,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  selected?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, busy }}
      disabled={busy}
      onPress={onPress}
      hitSlop={spacing.xs}
      style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: colors.muted }]}
    >
      <DirectionalIcon name={name} size={26} color={color} />
    </Pressable>
  );
}

/**
 * Text size as a little slider: small "A", four dots showing the current step, large "A".
 * Tap either A to step down / up; the choice is remembered for every exercise.
 */
export function TextSizeControl() {
  const { t } = useI18n();
  const index = useExamTextSize((s) => s.index);
  const larger = useExamTextSize((s) => s.larger);
  const smaller = useExamTextSize((s) => s.smaller);
  const last = TEXT_SCALES.length - 1;
  return (
    <View style={styles.sizeRow} accessibilityRole="adjustable" accessibilityLabel={t.common.textSize}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.common.smaller}
        accessibilityState={{ disabled: index === 0 }}
        disabled={index === 0}
        onPress={smaller}
        hitSlop={spacing.sm}
        style={[styles.sizeBtn, index === 0 && { opacity: 0.35 }]}
      >
        <AppText style={[styles.sizeA, { fontSize: 13, lineHeight: 18 }]}>A</AppText>
      </Pressable>
      <View style={styles.sizeDots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {TEXT_SCALES.map((_, i) => (
          <View
            key={i}
            style={[styles.sizeDot, { width: 5 + i * 2, height: 5 + i * 2 }, i <= index && styles.sizeDotOn]}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.common.larger}
        accessibilityState={{ disabled: index === last }}
        disabled={index === last}
        onPress={larger}
        hitSlop={spacing.sm}
        style={[styles.sizeBtn, index === last && { opacity: 0.35 }]}
      >
        <AppText style={[styles.sizeA, { fontSize: 21, lineHeight: 26 }]}>A</AppText>
      </Pressable>
    </View>
  );
}

/** Focus-mode top bar: close, what you are practising, bookmark. No tab bar, no big title. */
export function QuizTopBar({
  title,
  subtitle,
  color,
  onClose,
  right,
}: {
  title: string;
  subtitle?: string;
  color: string;
  onClose: () => void;
  right?: ReactNode;
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.topSafe}>
      <View style={styles.topBar}>
        <IconButton name="close" label="Übung schließen" onPress={onClose} />
        <View style={styles.topTitle}>
          <AppText style={styles.topName} numberOfLines={1} accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color={color} numberOfLines={1} style={{ fontWeight: '700' }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={styles.topRight}>{right}</View>
      </View>
    </SafeAreaView>
  );
}

/** Compact number + label tile for summaries (Ergebnis, Fragen, Zeit …). */
export function StatTile({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.tile, { backgroundColor: tint(color, '14') }]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <AppText style={styles.tileValue}>{value}</AppText>
      <AppText variant="caption" color={colors.mutedForeground} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  footerSafe: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footer: { padding: spacing.lg, gap: spacing.sm },

  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  segmentNow: { width: '45%', height: '100%', borderRadius: radius.pill },

  iconBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSafe: { backgroundColor: colors.surface },
  topBar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  topTitle: { flex: 1, alignItems: 'center' },
  topName: { fontSize: 17, lineHeight: 22, fontWeight: '700', color: colors.ink },
  topRight: { flexDirection: 'row', alignItems: 'center' },
  sizeRow: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
  },
  sizeBtn: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' },
  sizeA: { fontWeight: '800', color: colors.ink },
  sizeDots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sizeDot: { borderRadius: 6, backgroundColor: colors.border },
  sizeDotOn: { backgroundColor: colors.primary },

  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
  },
  tileValue: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
});
