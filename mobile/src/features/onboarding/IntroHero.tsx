import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '@/theme';

const HERO_HEIGHT_RATIO = 0.5;

// Sparkles and dots around the illustration: [left%, top%, size, kind].
const SPARKS: [number, number, number, 'spark' | 'dot'][] = [
  [20, 26, 22, 'spark'],
  [76, 24, 20, 'spark'],
  [88, 46, 18, 'spark'],
  [10, 52, 12, 'dot'],
  [82, 62, 16, 'dot'],
  [30, 70, 10, 'dot'],
  [64, 18, 12, 'dot'],
];

function Twinkle({ spec, index }: { spec: (typeof SPARKS)[number]; index: number }) {
  const [left, top, size, kind] = spec;
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 1400 + index * 220,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 1400 + index * 220,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, index]);
  const style = {
    position: 'absolute' as const,
    left: `${left}%` as const,
    top: `${top}%` as const,
    opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
    transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }],
  };
  return (
    <Animated.View pointerEvents="none" style={style}>
      {kind === 'spark' ? (
        <Ionicons name="sparkles" size={size} color="rgba(255,255,255,0.9)" />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: 'rgba(255,255,255,0.55)',
          }}
        />
      )}
    </Animated.View>
  );
}

/** Blue header with a curved lower edge and a simple "creating your profile" illustration. */
export function IntroHero() {
  const { width, height } = useWindowDimensions();
  const heroHeight = height * HERO_HEIGHT_RATIO;
  const [float] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ height: heroHeight, overflow: 'hidden' }}
    >
      {/* Oversized blue disc whose bottom arc forms the curved edge. */}
      <View
        style={{
          position: 'absolute',
          left: -width * 0.25,
          width: width * 1.5,
          top: -heroHeight,
          height: heroHeight * 2,
          backgroundColor: colors.brand,
          borderBottomLeftRadius: width * 0.75,
          borderBottomRightRadius: width * 0.75,
        }}
      />
      {SPARKS.map((s, i) => (
        <Twinkle key={i} spec={s} index={i} />
      ))}
      <Animated.View
        style={[
          styles.stage,
          {
            transform: [
              { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
            ],
          },
        ]}
      >
        <View style={[styles.ribbon, styles.ribbonLeft]} />
        <View style={[styles.ribbon, styles.ribbonRight]} />
        <View style={styles.orb}>
          <Ionicons name="person" size={72} color="#FFFFFF" />
        </View>
        <View style={styles.badge}>
          <Ionicons name="checkmark" size={26} color={colors.brand} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  orb: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#4F8CC9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: '30%',
    top: '30%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbon: { position: 'absolute', height: 46, borderRadius: 16, backgroundColor: '#E1E5E6' },
  ribbonLeft: { width: 170, left: '8%', top: '44%', transform: [{ rotate: '-14deg' }] },
  ribbonRight: { width: 150, right: '6%', top: '56%', transform: [{ rotate: '-10deg' }] },
});
