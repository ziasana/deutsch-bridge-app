import type { Dictionary } from '@/i18n';
import type {
  ExpressionMasteryBreakdown,
  MasteryBreakdown,
  MilestoneLadder,
} from '@/types/progress';

type ProgressText = Dictionary['progress'];

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
  t: ProgressText,
): BarSegment[] {
  return [
    { key: 'new', label: t.segments.new, count: b.newCount, color: c.new },
    { key: 'learning', label: t.segments.learning, count: b.learning, color: c.learning },
    { key: 'familiar', label: t.segments.familiar, count: b.familiar, color: c.familiar },
    { key: 'mastered', label: t.segments.mastered, count: b.mastered, color: c.mastered },
  ];
}

export function expressionSegments(
  b: ExpressionMasteryBreakdown,
  c: Record<'new' | 'learning' | 'familiar' | 'active' | 'mastered', string>,
  t: ProgressText,
): BarSegment[] {
  return [
    { key: 'new', label: t.segments.new, count: b.newCount, color: c.new },
    { key: 'learning', label: t.segments.learning, count: b.learning, color: c.learning },
    { key: 'familiar', label: t.segments.familiar, count: b.familiar, color: c.familiar },
    { key: 'active', label: t.segments.active, count: b.active, color: c.active },
    { key: 'mastered', label: t.segments.mastered, count: b.mastered, color: c.mastered },
  ];
}

/** "12 more words until 100" / "All milestones reached". */
export function nextMilestoneText(m: MilestoneLadder, t: ProgressText): string {
  if (m.nextThreshold == null) return t.milestoneNone;
  const left = Math.max(0, m.nextThreshold - m.wordsMastered);
  return t.milestoneLeft(left, m.nextThreshold);
}
