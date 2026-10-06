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

/** Home: a learner with a daily checklist, a streak flame and a calendar. Tap ticks the next task. */
export function HomeIllustration() {
  const bob = useBob(1500);
  const [done, setDone] = useState(1);
  const [pop] = useState(() => new Animated.Value(1));
  const tick = () => {
    setDone((d) => (d >= 3 ? 0 : d + 1));
    pop.setValue(0.7);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
  };
  const flame = bob.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] });
  const float = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const rows = [0, 1, 2];
  return (
    <View style={styles.box} accessible={false} importantForAccessibility="no-hide-descendants">
      <Pressable onPress={tick} style={styles.fill}>
        <Svg width={W} height={H} viewBox="0 0 140 140">
          {/* tilted rounded backdrop */}
          <Path
            d="M22 28 C40 8 96 6 122 24 C140 40 134 92 116 118 C98 142 44 138 24 116 C6 94 6 46 22 28 Z"
            fill="#F2F4F5"
          />
          <Circle cx="20" cy="46" r="2.5" fill="#FFFFFF" opacity="0.9" />
          <Circle cx="132" cy="112" r="3" fill="#BFD9FF" />
          {/* hair behind + torso */}
          <Path d="M46 44 C44 22 62 14 74 16 C90 18 98 32 94 50 Z" fill="#2B3A4A" />
          <Path d="M26 140 C28 104 48 92 70 92 C92 92 112 104 114 140 Z" fill="#2F6FDB" />
          {/* neck + head */}
          <Rect x="63" y="78" width="14" height="18" rx="6" fill="#E9A87F" />
          <Ellipse cx="70" cy="58" rx="19" ry="22" fill="#E9A87F" />
          <Path
            d="M51 54 C48 30 66 22 78 24 C94 26 98 42 90 56 C86 42 70 38 58 46 Z"
            fill="#2B3A4A"
          />
          {/* glasses + face */}
          <Circle
            cx="63"
            cy="60"
            r="6"
            fill="rgba(255,255,255,0.45)"
            stroke="#2B3A4A"
            strokeWidth="1.8"
          />
          <Circle
            cx="78"
            cy="60"
            r="6"
            fill="rgba(255,255,255,0.45)"
            stroke="#2B3A4A"
            strokeWidth="1.8"
          />
          <Path d="M69 60 L72 60" stroke="#2B3A4A" strokeWidth="1.8" />
          <Circle cx="63" cy="61" r="1.8" fill="#2B3A4A" />
          <Circle cx="78" cy="61" r="1.8" fill="#2B3A4A" />
          <Path
            d="M64 71 Q70 77 77 71"
            stroke="#B5594A"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* checklist board held in front */}
          <Rect x="34" y="96" width="72" height="44" rx="6" fill="#FFFFFF" />
          <Rect x="58" y="92" width="24" height="8" rx="4" fill="#9AA3AE" />
          {rows.map((i) => (
            <G key={i}>
              <Rect
                x="42"
                y={106 + i * 11}
                width="9"
                height="9"
                rx="2.5"
                fill={i < done ? '#2E8B57' : '#FFFFFF'}
                stroke={i < done ? '#2E8B57' : '#9AA3AE'}
                strokeWidth="1.6"
              />
              {i < done ? (
                <Path
                  d={`M44 ${110.5 + i * 11} l2.2 2.4 l3.8 -4.6`}
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ) : null}
              <Rect x="57" y={108 + i * 11} width={34 - i * 5} height="4" rx="2" fill="#C9CED6" />
            </G>
          ))}
        </Svg>
        {/* streak flame */}
        <Animated.View
          style={[styles.flame, { transform: [{ scale: flame }] }]}
          pointerEvents="none"
        >
          <Svg width={34} height={42} viewBox="0 0 34 42">
            <Path
              d="M17 2 C20 12 31 16 31 27 C31 36 24 41 17 41 C10 41 3 36 3 27 C3 20 8 17 10 11 C13 14 14 16 15 18 C17 14 17 8 17 2 Z"
              fill="#F5762B"
            />
            <Path
              d="M17 20 C20 25 25 27 25 32 C25 36 21 38 17 38 C13 38 9 36 9 32 C9 27 14 25 17 20 Z"
              fill="#FFC857"
            />
          </Svg>
        </Animated.View>
        {/* calendar page */}
        <Animated.View
          style={[
            styles.calendar,
            { transform: [{ translateY: float }, { rotate: '8deg' }, { scale: pop }] },
          ]}
          pointerEvents="none"
        >
          <View style={styles.calTop} />
          <AppText style={styles.calText} color="#2B3A4A">
            {done}/3
          </AppText>
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
  flame: { position: 'absolute', left: 4, top: 8, width: 34, height: 42 },
  calendar: {
    position: 'absolute',
    right: 0,
    top: 20,
    width: 38,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    overflow: 'hidden',
  },
  calTop: { width: '100%', height: 10, backgroundColor: '#E5654F' },
  calText: { fontSize: 14, lineHeight: 26, fontWeight: '800' },
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
