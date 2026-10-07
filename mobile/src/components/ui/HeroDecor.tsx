import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

/** Loops a slow back-and-forth drift; stays put when the user prefers reduced motion. */
function useDrift(range: number, duration: number, delay: number, reduce: boolean) {
  const [v] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [v, duration, delay, reduce]);
  return {
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-range / 2, range / 2] }) },
      {
        translateX: v.interpolate({ inputRange: [0, 1], outputRange: [range * 0.3, -range * 0.3] }),
      },
    ],
  };
}

function Blob({
  size,
  color,
  style,
  range,
  duration,
  delay = 0,
  reduce,
}: {
  size: number;
  color: string;
  style: object;
  range: number;
  duration: number;
  delay?: number;
  reduce: boolean;
}) {
  const drift = useDrift(range, duration, delay, reduce);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2 },
        { backgroundColor: color },
        style,
        drift,
      ]}
    />
  );
}

/** A floating flash card. Tap it to bounce and flip to its other side ("Haus" -> "das Haus"). */
function FloatingWord({
  front,
  back,
  color,
  style,
  rotate,
  range,
  duration,
  delay,
  reduce,
}: {
  front: string;
  back: string;
  color: string;
  style: object;
  rotate: number;
  range: number;
  duration: number;
  delay: number;
  reduce: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const [pop] = useState(() => new Animated.Value(1));
  const drift = useDrift(range, duration, delay, reduce);
  const onPress = () => {
    setFlipped((f) => !f);
    Animated.sequence([
      Animated.timing(pop, { toValue: 0.82, duration: 90, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 3, tension: 220, useNativeDriver: true }),
    ]).start();
  };
  const label = flipped ? back : front;
  return (
    <Animated.View style={[{ position: 'absolute' }, style, drift]} pointerEvents="box-none">
      <Animated.View style={{ transform: [{ rotate: `${rotate}deg` }, { scale: pop }] }}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          hitSlop={8}
          style={[styles.word, { borderColor: `${color}66` }]}
        >
          <AppText variant="caption" color={colors.primaryDark} style={{ fontWeight: '800' }}>
            {label}
          </AppText>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled?.()?.then((r) => alive && setReduce(r));
    return () => {
      alive = false;
    };
  }, []);
  return reduce;
}

/** Same fixed slots as the web hero: left (%), diameter, rise duration (ms), head start (0..1 of a cycle). */
const BUBBLES = [
  { left: 6, size: 12, duration: 8000, phase: 0.12 },
  { left: 18, size: 30, duration: 11000, phase: 0.36 },
  { left: 30, size: 9, duration: 7500, phase: 0.8 },
  { left: 42, size: 20, duration: 9500, phase: 0.26 },
  { left: 54, size: 34, duration: 12500, phase: 0.72 },
  { left: 64, size: 10, duration: 8500, phase: 0.59 },
  { left: 74, size: 24, duration: 10500, phase: 0.71 },
  { left: 84, size: 14, duration: 9000, phase: 0.33 },
  { left: 92, size: 28, duration: 13000, phase: 0.8 },
  { left: 48, size: 8, duration: 7000, phase: 0.07 },
];

/** A glassy bubble that rises from the bottom of the hero, sways, swells and fades out near the top. */
function Bubble({
  left,
  size,
  duration,
  phase,
  height,
  reduce,
  color,
}: {
  color: string;
  left: number;
  size: number;
  duration: number;
  phase: number;
  height: number;
  reduce: boolean;
}) {
  const [p] = useState(() => new Animated.Value(phase));
  useEffect(() => {
    if (reduce || height === 0) return;
    let stopped = false;
    let current: Animated.CompositeAnimation | undefined;
    const run = (from: number) => {
      p.setValue(from);
      current = Animated.timing(p, {
        toValue: 1,
        duration: duration * (1 - from),
        easing: Easing.linear,
        useNativeDriver: true,
      });
      current.start(({ finished }) => {
        if (finished && !stopped) run(0);
      });
    };
    run(phase);
    return () => {
      stopped = true;
      current?.stop();
    };
  }, [p, duration, phase, height, reduce]);

  const sway = 14;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bubble,
        {
          left: `${left}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${color}2E`,
          borderColor: `${color}40`,
          opacity: p.interpolate({
            inputRange: [0, 0.1, 0.7, 1],
            outputRange: [0, 1, 1, 0],
          }),
          transform: [
            {
              translateY: p.interpolate({
                inputRange: [0, 1],
                outputRange: [height * 1.08, -height * 0.3],
              }),
            },
            {
              translateX: p.interpolate({
                inputRange: [0, 0.1, 0.35, 0.65, 1],
                outputRange: [0, sway * 0.4, sway, -sway, sway * 0.5],
              }),
            },
            {
              scale: p.interpolate({
                inputRange: [0, 0.1, 0.35, 0.65, 1],
                outputRange: [0.7, 1, 1.07, 0.94, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.shine, { width: size * 0.3, height: size * 0.3 }]} />
    </Animated.View>
  );
}

/** Bubbles rising across the whole hero; they hold still when reduced motion is on. */
function RisingBubbles({ color }: { color: string }) {
  const reduce = useReduceMotion();
  const [height, setHeight] = useState(0);
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      {BUBBLES.map((b, i) => (
        <Bubble key={i} {...b} color={color} height={height} reduce={reduce} />
      ))}
    </View>
  );
}

/** Soft drifting shapes, a dot grid and a few tappable word cards behind/around the hero text. */
export function HeroBackdrop({ color = colors.primary }: { color?: string }) {
  const reduce = useReduceMotion();

  return (
    <>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 3 }).map((__, c) => (
              <Circle
                key={`${r}-${c}`}
                cx={14 + c * 14}
                cy={16 + r * 14}
                r={1.6}
                fill={color}
                fillOpacity={0.35}
              />
            )),
          )}
        </Svg>
        <Blob
          size={190}
          color={`${color}26`}
          style={{ top: -70, right: -60 }}
          range={18}
          duration={5200}
          reduce={reduce}
        />
        <Blob
          size={120}
          color="#FFFFFF66"
          style={{ bottom: -40, left: -30 }}
          range={14}
          duration={4400}
          delay={600}
          reduce={reduce}
        />
        <RisingBubbles color={color} />
      </View>
    </>
  );
}

export type HeroWord = { front: string; back: string };

const WORD_SLOTS = [
  { style: { top: 58, left: '46%' }, rotate: -8, range: 10, duration: 3800, delay: 0 },
  { style: { bottom: 10, right: 14 }, rotate: 7, range: 12, duration: 4600, delay: 500 },
  { style: { bottom: 10, left: '58%' }, rotate: -4, range: 8, duration: 3300, delay: 900 },
] as const;

/** Tappable cards, rendered above the hero content so they receive touches. */
export function HeroWords({
  words,
  color = colors.primary,
}: {
  words: HeroWord[];
  color?: string;
}) {
  const reduce = useReduceMotion();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {words.slice(0, WORD_SLOTS.length).map((w, i) => (
        <FloatingWord key={w.front} {...w} {...WORD_SLOTS[i]} color={color} reduce={reduce} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { position: 'absolute', top: 0, borderWidth: 1 },
  shine: {
    position: 'absolute',
    top: '16%',
    left: '20%',
    borderRadius: 99,
    backgroundColor: '#FFFFFFD9',
  },
  word: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFFE6',
    borderWidth: 1.5,
  },
});
