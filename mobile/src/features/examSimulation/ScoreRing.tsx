import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from '@/components/ui';
import { colors } from '@/theme';
import { formatPoints } from './format';

type Props = {
  score: number | null;
  max: number | null;
  /** Points where "bestanden" starts: drawn as a tick on the ring. */
  threshold: number;
  size?: number;
  stroke?: number;
  /** Colours for the arc and the track (the hero on a coloured background uses white). */
  arc: string;
  track?: string;
  textColor?: string;
  subColor?: string;
  label: string;
};

/** Score as a ring; the tick on the ring is the pass threshold. */
export function ScoreRing({ score, max, threshold, size = 84, stroke = 8, arc, track = colors.secondary, textColor = colors.ink, subColor = colors.mutedForeground, label }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score != null && max ? Math.min(1, Math.max(0, score / max)) : 0;
  const angle = (max ? (threshold / max) * 2 * Math.PI : 0) - Math.PI / 2;
  const tx = size / 2 + Math.cos(angle) * r;
  const ty = size / 2 + Math.sin(angle) * r;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={arc}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          fill="none"
        />
      </Svg>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={tx} cy={ty} r={stroke / 2 + 1} fill="#FFFFFF" stroke="rgba(0,0,0,0.35)" strokeWidth={1.5} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <AppText style={{ fontSize: size * 0.27, lineHeight: size * 0.32, fontWeight: '800', color: textColor, fontVariant: ['tabular-nums'] }}>
          {score != null ? formatPoints(score) : '–'}
        </AppText>
        <AppText style={{ fontSize: Math.max(10, size * 0.12), color: subColor, fontWeight: '600' }}>von {formatPoints(max)}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
