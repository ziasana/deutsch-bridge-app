import type {
  ExpressionMasteryBreakdown,
  MasteryBreakdown,
  MilestoneLadder,
} from '@/types/progress';

export interface BarSegment {
  key: string;
  label: string;
  count: number;
  color: string;
}

export const percent = (part: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((part / total) * 100)) : 0;

/** Segments in learning order; the colors are passed in so the theme stays in one place. */
export function vocabularySegments(
  b: MasteryBreakdown,
  c: Record<'new' | 'learning' | 'familiar' | 'mastered', string>,
): BarSegment[] {
  return [
    { key: 'new', label: 'Neu', count: b.newCount, color: c.new },
    { key: 'learning', label: 'Am Lernen', count: b.learning, color: c.learning },
    { key: 'familiar', label: 'Vertraut', count: b.familiar, color: c.familiar },
    { key: 'mastered', label: 'Gemeistert', count: b.mastered, color: c.mastered },
  ];
}

export function expressionSegments(
  b: ExpressionMasteryBreakdown,
  c: Record<'new' | 'learning' | 'familiar' | 'active' | 'mastered', string>,
): BarSegment[] {
  return [
    { key: 'new', label: 'Neu', count: b.newCount, color: c.new },
    { key: 'learning', label: 'Am Lernen', count: b.learning, color: c.learning },
    { key: 'familiar', label: 'Vertraut', count: b.familiar, color: c.familiar },
    { key: 'active', label: 'Aktiv', count: b.active, color: c.active },
    { key: 'mastered', label: 'Gemeistert', count: b.mastered, color: c.mastered },
  ];
}

/** "Noch 12 Wörter bis 100" / "Alle Meilensteine erreicht". */
export function nextMilestoneText(m: MilestoneLadder): string {
  if (m.nextThreshold == null) return 'Alle Meilensteine erreicht 🎉';
  const left = Math.max(0, m.nextThreshold - m.wordsMastered);
  return `Noch ${left} ${left === 1 ? 'Wort' : 'Wörter'} bis ${m.nextThreshold}`;
}
