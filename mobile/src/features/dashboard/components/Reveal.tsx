import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';

/** Fades and slides its child in; `index` staggers siblings so a page builds up card by card. */
export function Reveal({ index = 0, children }: { index?: number; children: ReactNode }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 380,
      delay: Math.min(index, 6) * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, index]);
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** Press feedback: the child shrinks slightly while held. */
export function usePressScale(to = 0.97) {
  const [scale] = useState(() => new Animated.Value(1));
  const spring = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      friction: 7,
      tension: 220,
      useNativeDriver: true,
    }).start();
  return {
    scale,
    onPressIn: () => spring(to),
    onPressOut: () => spring(1),
  };
}
