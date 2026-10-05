/** Encouraging result headline shared by every practice flow (never discouraging). */
export function resultTitle(score: number, total: number): string {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.8) return 'Sehr gut!';
  if (ratio >= 0.5) return 'Gut gemacht!';
  return 'Weiter so!';
}
