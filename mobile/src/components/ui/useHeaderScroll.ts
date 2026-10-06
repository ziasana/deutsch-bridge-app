import { useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * For pages with a blue header that scrolls away: `gone` flips once the content has scrolled past
 * `threshold`, so the status-bar icons can switch from light (on blue) to dark (on white).
 */
export function useHeaderScroll(threshold: number) {
  const [gone, setGone] = useState(false);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = e.nativeEvent.contentOffset.y > threshold;
    setGone((prev) => (prev === next ? prev : next));
  };
  return { gone, onScroll, scrollEventThrottle: 32 as const };
}
