import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
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

/** Learn: a student reading an open book, with letter tiles and an idea bulb. Tap to cheer. */
export function LearnIllustration() {
  const bob = useBob(1700);
  const { v, hop } = useHop();
  const glow = Animated.add(
    bob.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
    v.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }),
  );
  const tile = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const lift = v.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  return (
    <View style={styles.box} accessible={false} importantForAccessibility="no-hide-descendants">
      <Pressable onPress={hop} style={styles.fill}>
        <Svg width={W} height={H} viewBox="0 0 140 140">
          {/* leaf-shaped backdrop */}
          <Path
            d="M12 112 C4 60 36 14 84 10 C118 8 136 30 130 66 C124 104 88 134 48 132 C28 131 16 124 12 112 Z"
            fill="#F2F4F5"
          />
          <Circle cx="22" cy="36" r="2.5" fill="#FFFFFF" opacity="0.9" />
          <Circle cx="128" cy="96" r="3" fill="#BFD9FF" />
          {/* hair behind */}
          <Ellipse cx="72" cy="58" rx="24" ry="27" fill="#6B3E2E" />
          {/* torso */}
          <Path d="M28 140 C30 104 50 90 72 90 C94 90 114 104 116 140 Z" fill="#E8832E" />
          {/* neck + head */}
          <Rect x="65" y="76" width="14" height="18" rx="6" fill="#F0B393" />
          <Ellipse cx="72" cy="58" rx="19" ry="22" fill="#F0B393" />
          {/* fringe */}
          <Path
            d="M53 56 C50 32 66 24 78 26 C94 28 98 44 92 58 C88 44 72 38 60 48 Z"
            fill="#6B3E2E"
          />
          {/* face */}
          <Circle cx="65" cy="60" r="2" fill="#2B3A4A" />
          <Circle cx="80" cy="60" r="2" fill="#2B3A4A" />
          <Path
            d="M66 70 Q72 76 79 70"
            stroke="#B5594A"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <Ellipse cx="60" cy="67" rx="3.5" ry="2" fill="#F29C86" opacity="0.5" />
          <Ellipse cx="85" cy="67" rx="3.5" ry="2" fill="#F29C86" opacity="0.5" />
          {/* open book held in front */}
          <Path d="M30 104 L70 98 L70 128 L30 134 Z" fill="#FFFFFF" />
          <Path d="M114 104 L74 98 L74 128 L114 134 Z" fill="#F6F7F9" />
          <Path d="M70 98 L74 98 L74 128 L70 128 Z" fill="#C9CED6" />
          <Path
            d="M38 110 L62 106 M38 116 L62 112 M38 122 L62 118 M82 106 L106 110 M82 112 L106 116"
            stroke="#C9CED6"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path d="M28 103 L28 134" stroke="#2F6FDB" strokeWidth="3" strokeLinecap="round" />
          <Path d="M116 103 L116 134" stroke="#2F6FDB" strokeWidth="3" strokeLinecap="round" />
          {/* pencil behind ear */}
          <Path d="M88 48 L100 40" stroke="#F5A524" strokeWidth="3" strokeLinecap="round" />
        </Svg>
        {/* floating letter tiles */}
        <Animated.View
          style={[
            styles.tile,
            {
              left: 0,
              top: 22,
              backgroundColor: '#2E8B57',
              transform: [{ translateY: tile }, { rotate: '-10deg' }],
            },
          ]}
          pointerEvents="none"
        >
          <AppText style={styles.tileText} color="#FFFFFF">
            A
          </AppText>
        </Animated.View>
        <Animated.View
          style={[
            styles.tile,
            {
              left: 6,
              top: 62,
              backgroundColor: '#E5654F',
              transform: [{ translateY: lift }, { rotate: '8deg' }],
            },
          ]}
          pointerEvents="none"
        >
          <AppText style={styles.tileText} color="#FFFFFF">
            ä
          </AppText>
        </Animated.View>
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
  tile: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: { fontSize: 16, lineHeight: 20, fontWeight: '800' },
  box: { width: W, height: H },
  fill: { position: 'absolute', left: 0, top: 0, width: W, height: H },
  bulb: { position: 'absolute', right: 2, top: 0, width: 36, height: 43 },
});
