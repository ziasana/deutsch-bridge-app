import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Platform, StyleSheet, Vibration, View, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { SECTION_META } from '../../examMeta';

/** The Schreiben accent colour, shared with the exam section. */
export const WRITING_COLOR = SECTION_META.SCHRIFTLICHER_AUSDRUCK.color;

export const CORRECT_MESSAGES = [
  'Richtig! 🎉',
  'Genau! 👏',
  'Super gemacht! ⭐',
  'Stark! 💪',
  'Perfekt! ✅',
];
export const WRONG_MESSAGES = [
  'Fast! Schau dir die Erklärung an.',
  'Nicht ganz – so merkst du es dir.',
  'Kein Problem – das lernst du jetzt.',
];
export const pickMessage = (messages: readonly string[], salt: number) =>
  messages[salt % messages.length];

/** A short buzz on Android; iOS only has one long vibration, which would feel wrong for a tap. */
export function buzz(ms = 12) {
  if (Platform.OS === 'android') Vibration.vibrate(ms);
}

/** Springs its content in (scale + fade) when it appears. */
export function Pop({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 6, tension: 140, useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Shakes sideways each time `trigger` changes (a wrong answer). */
export function Shake({
  trigger,
  children,
  style,
}: {
  trigger: number;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const [x] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (trigger === 0) return;
    Animated.sequence([
      Animated.timing(x, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(x, { toValue: -8, duration: 90, useNativeDriver: true }),
      Animated.timing(x, { toValue: 5, duration: 70, useNativeDriver: true }),
      Animated.timing(x, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [trigger, x]);
  return (
    <Animated.View style={[style, { transform: [{ translateX: x }] }]}>{children}</Animated.View>
  );
}

/** One small, focused learning chunk: eyebrow, title and a little body. */
export function Slide({
  emoji,
  eyebrow,
  title,
  children,
}: {
  emoji?: string;
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: 4 }}>
        {eyebrow ? (
          <AppText variant="caption" color={WRITING_COLOR} style={styles.eyebrow}>
            {eyebrow.toUpperCase()}
          </AppText>
        ) : null}
        <AppText style={styles.slideTitle} accessibilityRole="header">
          {emoji ? `${emoji}  ` : ''}
          {title}
        </AppText>
      </View>
      {children ? <View style={{ gap: spacing.md }}>{children}</View> : null}
    </View>
  );
}

export const Lead = ({ children }: { children: ReactNode }) => (
  <AppText style={styles.lead}>{children}</AppText>
);

export function Chips({ items }: { items: string[] }) {
  return (
    <View style={styles.chips}>
      {items.map((i) => (
        <View key={i} style={styles.chip}>
          <AppText>{i}</AppText>
        </View>
      ))}
    </View>
  );
}

/** Bullet-like row in a soft tinted box. */
export const Tinted = ({ children }: { children: ReactNode }) => (
  <View style={styles.tinted}>{children}</View>
);

/** Immediate reaction after an answer. */
export function Feedback({
  correct,
  message,
  explanation,
}: {
  correct: boolean;
  message: string;
  explanation?: string | null;
}) {
  return (
    <Pop>
      <View
        accessibilityRole="alert"
        style={[styles.feedback, correct ? styles.good : styles.warn]}
      >
        <AppText style={{ fontWeight: '800' }} color={correct ? '#1B7A55' : '#8A5A00'}>
          {message}
        </AppText>
        {explanation ? <AppText>{explanation}</AppText> : null}
      </View>
    </Pop>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontWeight: '800', letterSpacing: 0.6 },
  slideTitle: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: colors.ink },
  lead: { fontSize: 17, lineHeight: 26, color: colors.foreground },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  tinted: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accent },
  feedback: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.md },
  good: { backgroundColor: colors.successSoft },
  warn: { backgroundColor: colors.warningSoft },
});
