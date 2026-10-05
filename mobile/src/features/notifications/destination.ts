import type { Href } from 'expo-router';
import { toMobileHref } from '@/features/dashboard/routes';

/** An unknown destination resolves to this very screen, which means "stay here". */
export const NO_DESTINATION = '/settings/notifications' as const;

/**
 * Maps the backend's destination (a *web* path) to a mobile route. Only in-app paths are followed
 * (a guard against anything else the server, or a push payload, might carry); null = nowhere to go.
 */
export function inAppHref(web: string | null | undefined): Href | null {
  if (!web || !web.startsWith('/') || web.startsWith('//')) return null;
  const href = toMobileHref(web, NO_DESTINATION);
  return href === NO_DESTINATION ? null : href;
}
