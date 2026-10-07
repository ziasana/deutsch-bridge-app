import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useI18n } from '@/i18n';

/**
 * Ionicons for icons that point somewhere (arrows, chevrons): mirrored in right-to-left layouts so
 * "forward" still points the reading direction. Icons whose name has no back/forward are never mirrored, so it is safe as a default.
 */
export function DirectionalIcon({ style, ...rest }: ComponentProps<typeof Ionicons>) {
  const { isRTL } = useI18n();
  // Only icons that point somewhere are mirrored; anything else (star, bulb …) is left alone.
  const flip = isRTL && /back|forward|^play/.test(String(rest.name));
  return <Ionicons {...rest} style={[style, flip && { transform: [{ scaleX: -1 }] }]} />;
}
