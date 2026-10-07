import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText } from '@/components/ui';
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

/** A decorative chip that bobs up and down out of step with the others. */
function Floater({
  delay,
  style,
  children,
}: {
  delay: number;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay]);
  return (
    <Animated.View
      style={[
        styles.chip,
        style,
        {
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }],
        },
      ]}
    >
      {children}
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
        <View style={styles.orb}>
          <Ionicons name="person" size={78} color="#FFFFFF" />
        </View>
        <View style={styles.badge}>
          <Ionicons name="checkmark" size={26} color={colors.brand} />
        </View>

        {/* The profile being created: avatar, name and e-mail lines, verified tick. */}
        <View style={styles.card}>
          <View style={styles.cardAvatar}>
            <Ionicons name="happy-outline" size={24} color={colors.brand} />
          </View>
          <View style={styles.cardLines}>
            <View style={[styles.line, { width: '70%', backgroundColor: '#C9D6EA' }]} />
            <View style={[styles.line, { width: '46%' }]} />
          </View>
          <Ionicons name="checkmark-circle" size={26} color={colors.success} />
        </View>

        <Floater delay={0} style={styles.hello}>
          <AppText style={styles.helloText} color={colors.brand}>
            Hallo!
          </AppText>
        </Floater>
        <Floater delay={500} style={styles.level}>
          <AppText style={styles.levelText} color="#FFFFFF">
            A1 → B2
          </AppText>
        </Floater>
        <Floater delay={900} style={[styles.round, styles.book]}>
          <Ionicons name="book" size={22} color={colors.brand} />
        </Floater>
        <Floater delay={300} style={[styles.round, styles.trophy]}>
          <Ionicons name="trophy" size={22} color="#E8A21A" />
        </Floater>
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
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4F8CC9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 56,
  },
  badge: {
    position: 'absolute',
    right: '31%',
    top: '14%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    bottom: 18,
    width: 236,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#10306B',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3EEFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLines: { flex: 1, gap: 8 },
  line: { height: 9, borderRadius: 5, backgroundColor: '#E1E5E6' },
  chip: { position: 'absolute' },
  hello: {
    left: '8%',
    top: '22%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-6deg' }],
  },
  helloText: { fontSize: 16, lineHeight: 20, fontWeight: '800' },
  level: {
    right: '7%',
    top: '40%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#2F6FD0',
  },
  levelText: { fontSize: 14, lineHeight: 18, fontWeight: '800' },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  book: { left: '12%', top: '52%' },
  trophy: { right: '14%', top: '62%' },
});
