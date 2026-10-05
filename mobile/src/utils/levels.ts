/** The level to show first: the learner's own level when it has content, else the first with content. */
export function pickInitialLevel(
  profileLevel: string | null | undefined,
  summaries: { level: string; total: number }[],
): string | null {
  const valid = profileLevel && profileLevel !== 'null' ? profileLevel : null;
  if (valid && summaries.some((s) => s.level === valid)) return valid;
  return summaries.find((s) => s.total > 0)?.level ?? summaries[0]?.level ?? valid;
}
