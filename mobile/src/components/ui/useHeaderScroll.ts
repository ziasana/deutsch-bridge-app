import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

/**
 * For pages with a blue header that scrolls away: `gone` flips once the content has scrolled past
 * `threshold`, so the status-bar icons can switch from light (on blue) to dark (on white).
 *
 * Also guards against the iOS "stuck overscroll": a pull-to-refresh or bounce that was interrupted
 * by switching tabs can leave the (kept-alive) tab screen scrolled above its top, so the page
 * reappears shifted down with a blank gap over it. Whenever the screen gets focus again, a negative
 * offset is snapped back to the top. Attach `ref` to the ScrollView.
 */
export function useHeaderScroll(threshold: number) {
  const [gone, setGone] = useState(false);
  const ref = useRef<ScrollView>(null);
  const offset = useRef(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    offset.current = y;
    const next = y > threshold;
    setGone((prev) => (prev === next ? prev : next));
  };

  useFocusEffect(
    useCallback(() => {
      if (offset.current < 0) {
        ref.current?.scrollTo({ y: 0, animated: false });
        offset.current = 0;
      }
    }, []),
  );

  return { gone, ref, onScroll, scrollEventThrottle: 32 as const };
}
