import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { BrandMark } from '@/components/brand/BrandMark';
import { AppText } from '@/components/ui';
import { colors } from '@/theme';

/** Total time the intro stays up before handing over to the welcome screen. */
const HOLD_MS = 2200;

let played = false;
/** The intro runs once per app launch; later visits (e.g. after logout) skip straight to welcome. */
export const hasPlayedIntro = () => played;
export const markIntroPlayed = () => {
  played = true;
};

/** First screen on a cold start: the logo pops in, the wordmark follows, then `onDone` fires. */
export function SplashIntro({ onDone }: { onDone: () => void }) {
  const [logo] = useState(() => new Animated.Value(0));
  const [word] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        logo.setValue(1);
        word.setValue(1);
      } else {
        Animated.sequence([
          Animated.spring(logo, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
          Animated.timing(word, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }
      timer = setTimeout(onDone, reduce ? 800 : HOLD_MS);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [logo, word, onDone]);

  return (
    <View style={styles.root} accessibilityLabel="DeutschCertify" accessible>
      <StatusBar style="light" />
      <Animated.View
        style={{
          opacity: logo,
          transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }}
      >
        <BrandMark size={150} variant="bare" />
      </Animated.View>
      <Animated.View
        style={{
          opacity: word,
          transform: [
            { translateY: word.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        }}
      >
        <AppText style={styles.wordmark} color="#FFFFFF">
          DeutschCertify
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  wordmark: { fontSize: 36, lineHeight: 44, fontWeight: '600', letterSpacing: 0.3 },
});
