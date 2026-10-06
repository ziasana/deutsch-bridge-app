import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { AppText } from '@/components/ui';
import { colors } from '@/theme';

const W = 220;
const H = 200;
const SKIN = '#F0B393';
const HAIR = '#2B3A4A';
const SHIRT = '#2F6FDB';

/** German phrases the tutor "says" — a tap on the character shows the next one. */
export const TUTOR_PHRASES = [
  'Hallo! 👋',
  'Wie geht’s?',
  'Ich lerne Deutsch!',
  'Danke schön!',
  'Guten Appetit!',
  'Bis später!',
];

/** Letters that drift around the character — tiny nods to what is being learned. */
const DOODLES: { text: string; left: number; top: number; size: number; delay: number }[] = [
  { text: 'ä', left: 150, top: 8, size: 20, delay: 0 },
  { text: 'ß', left: 188, top: 62, size: 17, delay: 500 },
  { text: 'A1', left: -6, top: 70, size: 14, delay: 900 },
  { text: '?', left: 4, top: 118, size: 18, delay: 1300 },
];

function Doodle({ spec }: { spec: (typeof DOODLES)[number] }) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(spec.delay),
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
  }, [t, spec.delay]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.doodle,
        {
          left: spec.left,
          top: spec.top,
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) },
          ],
        },
      ]}
    >
      <AppText
        style={{ fontSize: spec.size, lineHeight: spec.size * 1.25, fontWeight: '800' }}
        color="#FFFFFF"
      >
        {spec.text}
      </AppText>
    </Animated.View>
  );
}

function Character() {
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* soft backdrop shape, like a paper cut-out */}
      <Path
        d="M30 120 C10 70 50 20 100 25 C150 28 192 60 202 104 C212 146 170 192 110 197 C60 200 40 162 30 120 Z"
        fill="#F2F4F5"
      />
      {/* planet doodle */}
      <Circle cx="168" cy="34" r="9" fill={SHIRT} />
      <Ellipse
        cx="168"
        cy="34"
        rx="17"
        ry="4"
        fill="none"
        stroke="#9FB4CC"
        strokeWidth="2"
        transform="rotate(-18 168 34)"
      />
      <Circle cx="64" cy="48" r="4" fill={SHIRT} />
      {/* hair behind */}
      <Ellipse cx="110" cy="88" rx="34" ry="40" fill={HAIR} />
      {/* torso + arms */}
      <Path d="M44 200 C46 152 74 130 110 130 C146 130 174 152 176 200 Z" fill={SHIRT} />
      <Path
        d="M150 146 Q164 170 150 192"
        stroke={SHIRT}
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M70 148 Q54 168 70 184"
        stroke={SHIRT}
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />
      {/* neck + head */}
      <Rect x="100" y="106" width="20" height="28" rx="8" fill={SKIN} />
      <Path d="M97 132 Q110 148 123 132 Z" fill={SKIN} />
      <Ellipse cx="110" cy="84" rx="27" ry="31" fill={SKIN} />
      {/* fringe */}
      <Path
        d="M82 82 C78 46 100 34 116 36 C138 38 146 58 140 84 C134 64 112 56 92 70 Z"
        fill={HAIR}
      />
      {/* face */}
      <Circle cx="99" cy="86" r="9.5" fill="rgba(255,255,255,0.4)" stroke={HAIR} strokeWidth="2" />
      <Circle cx="121" cy="86" r="9.5" fill="rgba(255,255,255,0.4)" stroke={HAIR} strokeWidth="2" />
      <Path d="M108.5 86 L111.5 86" stroke={HAIR} strokeWidth="2" />
      <Circle cx="99" cy="87" r="2.2" fill={HAIR} />
      <Circle cx="121" cy="87" r="2.2" fill={HAIR} />
      <Path
        d="M101 101 Q110 109 119 101"
        stroke="#B5594A"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx="90" cy="98" rx="5" ry="3" fill="#F29C86" opacity="0.5" />
      <Ellipse cx="130" cy="98" rx="5" ry="3" fill="#F29C86" opacity="0.5" />
      {/* open book in the left hand */}
      <G>
        <Path d="M30 178 L78 164 L84 194 L36 206 Z" fill="#3E4C59" />
        <Path d="M36 176 L78 166 L82 190 L40 200 Z" fill="#FFFFFF" />
        <Path
          d="M44 180 L74 173 M45 186 L75 179"
          stroke="#C9CED6"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Circle cx="72" cy="184" r="7" fill={SKIN} />
      </G>
      {/* laptop on the right */}
      <Rect x="128" y="152" width="84" height="52" rx="5" fill="#E3E6EA" />
      <Circle cx="170" cy="178" r="4" fill="#FFFFFF" />
      <Rect x="120" y="198" width="100" height="6" rx="3" fill="#C9CED6" />
      <Circle cx="148" cy="194" r="7" fill={SKIN} />
    </Svg>
  );
}

type Props = { onUsePhrase?: (phrase: string) => void };

/**
 * Hero illustration for the Tutor: a studying tutor with floating letters and a speech bubble.
 * Tap the tutor for another phrase; tap the bubble to practise that phrase in the chat.
 */
export function TutorIllustration({ onUsePhrase }: Props) {
  const [index, setIndex] = useState(0);
  const [pop] = useState(() => new Animated.Value(1));
  const phrase = TUTOR_PHRASES[index];

  const next = () => {
    setIndex((i) => (i + 1) % TUTOR_PHRASES.length);
    pop.setValue(0.7);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.box}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tutor"
        accessibilityHint="Zeigt einen neuen deutschen Satz"
        onPress={next}
        style={styles.fill}
      >
        <Character />
      </Pressable>
      {DOODLES.map((d) => (
        <Doodle key={d.text} spec={d} />
      ))}
      <Animated.View style={[styles.bubbleWrap, { transform: [{ scale: pop }] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Satz üben: ${phrase}`}
          onPress={() => onUsePhrase?.(phrase)}
          style={styles.bubble}
        >
          <AppText style={styles.bubbleText} color={colors.ink} numberOfLines={1}>
            {phrase}
          </AppText>
          <Ionicons name="arrow-forward-circle" size={18} color={colors.brand} />
        </Pressable>
        <View style={styles.tail} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: W, height: H },
  fill: { position: 'absolute', left: 0, top: 0, width: W, height: H },
  doodle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(24,90,200,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleWrap: { position: 'absolute', left: 0, top: 4, alignItems: 'flex-start', maxWidth: W - 40 },
  bubble: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0B3A7A',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 18, fontWeight: '700' },
  tail: {
    marginLeft: 26,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    marginTop: -7,
  },
});
