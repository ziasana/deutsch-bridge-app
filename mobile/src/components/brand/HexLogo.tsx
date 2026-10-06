import { StyleSheet, Text, View } from 'react-native';

const SQRT3 = Math.sqrt(3);

type HexProps = { size: number; color: string };

/**
 * Pointy-top rounded hexagon, `size` = flat-to-flat width. Built from three rounded bars rotated
 * 0/60/120° (their union is a hexagon), so it needs no SVG dependency.
 */
export function Hex({ size, color }: HexProps) {
  // Minkowski sum of a smaller hexagon and a disc of radius r: each bar is the inner hexagon's bar
  // inflated by r, so the rounded corners join cleanly at the vertices.
  const r = size * 0.1;
  const inner = size - 2 * r;
  const bar = {
    position: 'absolute' as const,
    width: size,
    height: inner / SQRT3 + 2 * r,
    borderRadius: r,
    backgroundColor: color,
  };
  const frame = { width: size, height: size * (2 / SQRT3) };
  return (
    <View style={[styles.center, frame]}>
      <View style={bar} />
      <View style={[bar, { transform: [{ rotate: '60deg' }] }]} />
      <View style={[bar, { transform: [{ rotate: '120deg' }] }]} />
    </View>
  );
}

type Props = {
  size?: number;
  /** light = white hexagon on a coloured surface; dark = charcoal hexagon on white. */
  tone?: 'light' | 'dark';
  /** Background the logo sits on — needed to knock out the outline ring. */
  background?: string;
  /** Draws the thin outline hexagon around the mark (splash style). */
  ring?: boolean;
};

const TONES = {
  light: { hex: '#FFFFFF', letter: '#3F86F0', ring: '#FFFFFF' },
  dark: { hex: '#2A3238', letter: '#FFFFFF', ring: '#2A3238' },
};

/** Deutsch Bridge brand mark: a hexagon with a tilted "D". Decorative — pair with a text label. */
export function HexLogo({ size = 120, tone = 'light', background = '#3F86F0', ring }: Props) {
  const t = TONES[tone];
  const outer = size * 1.2;
  const stroke = Math.max(2, size * 0.02);
  const frameH = outer * (2 / SQRT3);
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.center, { width: outer, height: frameH }]}
    >
      {ring ? (
        <View style={styles.abs}>
          <Hex size={outer} color={t.ring} />
          <View style={styles.abs}>
            <Hex size={outer - stroke * 2} color={background} />
          </View>
        </View>
      ) : null}
      <View style={styles.abs}>
        <Hex size={size} color={t.hex} />
      </View>
      <Text
        style={[
          styles.letter,
          { color: t.letter, fontSize: size * 0.58, transform: [{ rotate: '-20deg' }] },
        ]}
      >
        D
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  abs: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  letter: { fontWeight: '900', includeFontPadding: false },
});
