import type { Dictionary } from '@/i18n';

const GERMAN = { veryGood: 'Sehr gut!', wellDone: 'Gut gemacht!', keepGoing: 'Weiter so!' };

/**
 * Encouraging result headline shared by every practice flow (never discouraging). Flows that are
 * not translated yet omit `t` and keep the German wording.
 */
export function resultTitle(
  score: number,
  total: number,
  t: Dictionary['common']['result'] = GERMAN,
): string {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.8) return t.veryGood;
  if (ratio >= 0.5) return t.wellDone;
  return t.keepGoing;
}
