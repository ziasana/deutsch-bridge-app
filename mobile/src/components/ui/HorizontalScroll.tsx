import { forwardRef, useRef } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { useI18n } from '@/i18n';

/**
 * Horizontal ScrollView that starts at the beginning of the reading direction. In a right-to-left
 * layout React Native still starts a horizontal scroller at the left edge, which hides the first
 * item behind the right edge, so it is scrolled to the far end once its content has been measured.
 */
export const HorizontalScroll = forwardRef<ScrollView, ScrollViewProps>(function HorizontalScroll(
  { onContentSizeChange, ...props },
  forwardedRef,
) {
  const { isRTL } = useI18n();
  const inner = useRef<ScrollView | null>(null);
  const settled = useRef(false);
  return (
    <ScrollView
      {...props}
      horizontal
      ref={(node) => {
        inner.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      onContentSizeChange={(w, h) => {
        if (isRTL && !settled.current) {
          settled.current = true;
          inner.current?.scrollToEnd({ animated: false });
        }
        onContentSizeChange?.(w, h);
      }}
    />
  );
});
