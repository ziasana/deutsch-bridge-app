/**
 * Passage text is markdown / editor HTML. A Sprachbausteine gap is embedded as
 * `<span data-exam-gap="N">N</span>`; show it as a bold "(N)" so it stands out in running text.
 */
export function withGapMarkers(content: string): string {
  return content.replace(/<span[^>]*data-exam-gap="(\d+)"[^>]*>[^<]*<\/span>/g, '**($1)**');
}

/** Transcripts written in the admin editor are HTML; older ones are plain text. */
export function isHtmlTranscript(raw: string): boolean {
  return /<\/?(p|br|h[1-6]|ul|ol|li|strong|em|b|i|u|s|blockquote|div|span|img)\b[^>]*>/i.test(raw);
}

/** True for null, whitespace, or an editor holding only empty paragraphs. */
export function isEmptyTranscript(raw: string | null | undefined): boolean {
  if (!raw) return true;
  return (
    raw
      .replace(/<img\b/gi, 'x')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim() === ''
  );
}

/** Plain-text transcript → paragraphs (blank lines separate them, single breaks are kept). */
export const plainParagraphs = (raw: string): string[] =>
  raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export const letterFor = (index: number) => String.fromCharCode(97 + index);

/** Admin-edited label for an answer-pool entry, falling back to its positional letter. */
export const optionLabelFor = (labels: string[] | null | undefined, index: number) =>
  labels?.[index]?.trim() || letterFor(index);

/** SITUATION_MATCHING answer for "no ad fits". */
export const NO_AD_ANSWER = 'X';

/** SITUATION_MATCHING answers are passage ids; show the ad's label ("e") instead of the raw id. */
export const answerLabelFor = (passages: { id: string; label: string }[], value: string) =>
  value === NO_AD_ANSWER ? 'x (keine Anzeige)' : (passages.find((p) => p.id === value)?.label ?? value);
