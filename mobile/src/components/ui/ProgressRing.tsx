import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from './AppText';
import { colors } from '@/theme';

type Props = {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  /** Font size of the centred percentage (default scales with the ring). */
  textSize?: number;
};

/** Circular progress (0–100) with the percentage in the middle. */
export function ProgressRing({
  value,
  size = 120,
  stroke = 12,
  color = colors.success,
  label = 'Fortschritt',
  textSize,
}: Props) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: pct, text: `${pct} Prozent` }}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.muted}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <AppText
          style={[
            styles.text,
            textSize ? { fontSize: textSize, lineHeight: textSize * 1.25 } : null,
          ]}
        >
          {pct}%
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: { position: 'absolute' },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: colors.ink },
});
