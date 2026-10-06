import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

const W = 140;
const H = 140;

/** Loops a 0→1→0 value; used for gentle bobbing. */
function useBob(duration = 1800) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);
  return t;
}

/** Tap = a little hop. */
function useHop() {
  const [v] = useState(() => new Animated.Value(0));
  const hop = () =>
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(v, { toValue: 0, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
  return { v, hop };
}

function Stars() {
  return (
    <>
      <Circle cx="28" cy="40" r="3" fill="#FFFFFF" opacity="0.9" />
      <Circle cx="150" cy="30" r="2.5" fill="#FFFFFF" opacity="0.8" />
      <Circle cx="140" cy="96" r="3.5" fill="#BFD9FF" />
      <Circle cx="18" cy="108" r="2.5" fill="#BFD9FF" />
    </>
  );
}

/** Home: a rocket lifting off — "start your learning routine". Tap to launch a hop. */
export function HomeIllustration() {
  const bob = useBob(1500);
  const { v, hop } = useHop();
  const y = Animated.add(
    bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }),
    v.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }),
  );
  return (
    <View style={styles.box} accessible={false} importantForAccessibility="no-hide-descendants">
      <Pressable onPress={hop} style={styles.fill}>
        <Svg width={W} height={H} viewBox="0 0 170 170">
          <Path
            d="M20 118 C6 70 40 22 88 24 C136 26 166 66 156 112 C148 148 100 166 60 158 C36 153 26 138 20 118 Z"
            fill="#F2F4F5"
          />
          <Stars />
          <Ellipse cx="46" cy="136" rx="30" ry="9" fill="#FFFFFF" opacity="0.85" />
          <Ellipse cx="124" cy="140" rx="24" ry="8" fill="#FFFFFF" opacity="0.7" />
        </Svg>
        <Animated.View
          style={[styles.fill, { transform: [{ translateY: y }] }]}
          pointerEvents="none"
        >
          <Svg width={W} height={H} viewBox="0 0 170 170">
            <G rotation="22" origin="85, 85">
              {/* flame */}
              <Path d="M85 128 C74 138 80 152 85 158 C90 152 96 138 85 128 Z" fill="#F5A524" />
              <Path d="M85 128 C80 134 83 142 85 146 C87 142 90 134 85 128 Z" fill="#FFE08A" />
              {/* fins */}
              <Path d="M66 100 L50 126 L70 118 Z" fill="#E5654F" />
              <Path d="M104 100 L120 126 L100 118 Z" fill="#E5654F" />
              {/* body */}
              <Path d="M85 24 C104 42 108 80 102 124 L68 124 C62 80 66 42 85 24 Z" fill="#FFFFFF" />
              <Path d="M85 24 C96 34 102 48 103 62 L67 62 C68 48 74 34 85 24 Z" fill="#2F6FDB" />
              <Circle cx="85" cy="84" r="11" fill="#2F6FDB" />
              <Circle cx="85" cy="84" r="7" fill="#BFD9FF" />
              <Rect x="68" y="112" width="34" height="8" rx="4" fill="#C9CED6" />
            </G>
          </Svg>
        </Animated.View>
      </Pressable>
    </View>
  );
}

/** Learn: a stack of books with a glowing idea bulb. Tap to make the bulb pulse. */
export function LearnIllustration() {
  const bob = useBob(1700);
  const { v, hop } = useHop();
  const glow = Animated.add(
    bob.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
    v.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }),
  );
  return (
    <View style={styles.box} accessible={false} importantForAccessibility="no-hide-descendants">
      <Pressable onPress={hop} style={styles.fill}>
        <Svg width={W} height={H} viewBox="0 0 170 170">
          <Path
            d="M18 112 C8 66 44 24 90 26 C138 28 164 68 154 112 C146 148 100 164 60 156 C36 151 24 134 18 112 Z"
            fill="#F2F4F5"
          />
          <Stars />
          {/* book stack */}
          <Rect x="38" y="128" width="94" height="20" rx="4" fill="#2F6FDB" />
          <Rect x="44" y="132" width="82" height="4" rx="2" fill="#BFD9FF" />
          <Rect x="48" y="108" width="84" height="20" rx="4" fill="#2E8B57" />
          <Rect x="54" y="112" width="72" height="4" rx="2" fill="#B6E4CB" />
          <Rect x="42" y="88" width="80" height="20" rx="4" fill="#E8832E" />
          <Rect x="48" y="92" width="68" height="4" rx="2" fill="#FBD3AE" />
          {/* graduation cap on top */}
          <Path d="M82 52 L120 66 L82 80 L44 66 Z" fill="#2B3A4A" />
          <Path d="M62 74 L62 86 C72 92 92 92 102 86 L102 74 L82 81 Z" fill="#3C4F63" />
          <Path d="M120 66 L120 84" stroke="#F5A524" strokeWidth="2.5" />
          <Circle cx="120" cy="86" r="3.5" fill="#F5A524" />
        </Svg>
        {/* idea bulb */}
        <Animated.View
          style={[styles.bulb, { opacity: glow, transform: [{ scale: glow }] }]}
          pointerEvents="none"
        >
          <Svg width={36} height={43} viewBox="0 0 44 52">
            <Circle cx="22" cy="20" r="19" fill="#FFE08A" opacity="0.5" />
            <Path
              d="M22 6 C13 6 8 13 10 21 C11 25 15 27 15 32 L29 32 C29 27 33 25 34 21 C36 13 31 6 22 6 Z"
              fill="#FFD23F"
            />
            <Rect x="16" y="34" width="12" height="5" rx="2" fill="#C9CED6" />
            <Rect x="18" y="40" width="8" height="4" rx="2" fill="#9AA3AE" />
          </Svg>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: W, height: H },
  fill: { position: 'absolute', left: 0, top: 0, width: W, height: H },
  bulb: { position: 'absolute', right: 2, top: 0, width: 36, height: 43 },
});
