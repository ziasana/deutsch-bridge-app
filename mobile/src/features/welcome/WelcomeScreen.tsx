import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HexLogo } from '@/components/brand/HexLogo';
import { AppText, DirectionalIcon } from '@/components/ui';
import { SLIDE_KEYS, type Slide } from '@/features/welcome/slides';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

const SHEET_PADDING = spacing.xl;

// Decorative confetti around the logo: [left%, top%, size, colour, float distance, period ms].
const DOTS: [number, number, number, string, number, number][] = [
  [14, 14, 16, '#EBAFA0', 8, 2600],
  [80, 18, 20, '#363F63', 10, 3100],
  [10, 82, 22, '#DFE3E4', 7, 3400],
  [84, 84, 26, colors.primary, 9, 2800],
  [52, 6, 10, '#DFE3E4', 6, 2300],
  [92, 44, 12, '#DFE3E4', 8, 3700],
  [5, 34, 10, '#DFE3E4', 6, 2900],
  [40, 88, 12, '#EBAFA0', 7, 3000],
];

function FloatingDot({ spec }: { spec: (typeof DOTS)[number] }) {
  const [left, top, size, color, distance, period] = spec;
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: period,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: period,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, period]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] }) },
        ],
      }}
    />
  );
}

function PillButton({
  label,
  filled,
  onPress,
  hint,
}: {
  label: string;
  filled?: boolean;
  onPress: () => void;
  hint: string;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  const press = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      friction: 7,
      tension: 200,
      useNativeDriver: true,
    }).start();
  const fg = filled ? colors.primaryDark : '#FFFFFF';
  return (
    <Animated.View style={[styles.buttonWrap, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        onPress={onPress}
        onPressIn={() => press(0.96)}
        onPressOut={() => press(1)}
        style={[styles.button, filled ? styles.buttonFilled : styles.buttonOutline]}
      >
        <AppText variant="subheading" color={fg} style={styles.buttonLabel}>
          {label}
        </AppText>
        <DirectionalIcon name="caret-forward-outline" size={20} color={fg} />
      </Pressable>
    </Animated.View>
  );
}

/** Welcome / login-options page: brand on top, swipeable value pitch + Register / Login below. */
export function WelcomeScreen() {
  const { t } = useI18n();
  const w = t.entry.welcome;
  const slides: Slide[] = SLIDE_KEYS.map((key, i) => ({ key, ...w.slides[i] }));
  const { width } = useWindowDimensions();
  const pageWidth = width;
  const [page, setPage] = useState(0);
  const [scrollX] = useState(() => new Animated.Value(0));
  const [entrance] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      friction: 7,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
  });
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth));

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.hero}>
        <View style={styles.heroInner}>
          {DOTS.map((d, i) => (
            <FloatingDot key={i} spec={d} />
          ))}
          <Animated.View
            style={[
              styles.brand,
              {
                opacity: entrance,
                transform: [
                  { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                ],
              },
            ]}
          >
            <HexLogo size={128} tone="dark" background="#FFFFFF" />
            <AppText style={styles.wordmark} color="#2A3238" accessibilityRole="header">
              Deutsch Bridge
            </AppText>
          </Animated.View>
        </View>
      </SafeAreaView>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <FlatList<Slide>
          data={slides}
          keyExtractor={(s) => s.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumEnd}
          getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
          style={styles.pager}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: pageWidth }]}>
              <AppText style={styles.slideTitle} color="#FFFFFF" center accessibilityRole="header">
                {item.title}
              </AppText>
              <AppText style={styles.slideSubtitle} color="#FFFFFF" center>
                {item.subtitle}
              </AppText>
            </View>
          )}
        />

        <View style={styles.dots} accessible accessibilityLabel={w.page(page + 1, slides.length)}>
          {slides.map((s, i) => {
            const input = [(i - 1) * pageWidth, i * pageWidth, (i + 1) * pageWidth];
            return (
              <Animated.View
                key={s.key}
                style={[
                  styles.dot,
                  {
                    width: scrollX.interpolate({
                      inputRange: input,
                      outputRange: [10, 28, 10],
                      extrapolate: 'clamp',
                    }),
                    opacity: scrollX.interpolate({
                      inputRange: input,
                      outputRange: [0.5, 1, 0.5],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            );
          })}
        </View>

        <SafeAreaView edges={['bottom']} style={styles.actions}>
          <PillButton
            label={w.register}
            hint={w.registerHint}
            onPress={() => router.push('/register')}
          />
          <PillButton
            filled
            label={w.login}
            hint={w.loginHint}
            onPress={() => router.push('/login')}
          />
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  hero: { flex: 1 },
  heroInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brand: { alignItems: 'center', gap: spacing.md },
  wordmark: { fontSize: 38, lineHeight: 46, fontWeight: '600', letterSpacing: 0.3 },
  sheet: {
    backgroundColor: colors.brand,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 64,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xl,
  },
  pager: { flexGrow: 0 },
  slide: { paddingHorizontal: SHEET_PADDING + spacing.md, gap: spacing.md, minHeight: 150 },
  slideTitle: { fontSize: 28, lineHeight: 36, fontWeight: '800' },
  slideSubtitle: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  dot: { height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: SHEET_PADDING,
    paddingBottom: spacing.lg,
  },
  buttonWrap: { flex: 1 },
  button: {
    minHeight: 56,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonOutline: { borderWidth: 2, borderColor: '#FFFFFF' },
  buttonFilled: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF' },
  buttonLabel: { fontWeight: '700' },
});
