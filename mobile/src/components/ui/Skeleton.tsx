import { useEffect, useState } from 'react';
import { Animated, type DimensionValue, StyleSheet } from 'react-native';
import { colors, radius } from '@/theme';

type Props = { width?: DimensionValue; height?: number };

export function Skeleton({ width = '100%', height = 16 }: Props) {
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, { width, height, opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.secondary, borderRadius: radius.sm },
});
