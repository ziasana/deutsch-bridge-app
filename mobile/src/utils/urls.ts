import { env } from '@/config/env';

/** Backend-relative "/uploads/..." paths become absolute so images load on a device. */
export function resolveUploadUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('/uploads/') ? `${env.apiOrigin}${url}` : url;
}
