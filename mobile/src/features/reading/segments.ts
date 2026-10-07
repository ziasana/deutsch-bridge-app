import type { Annotation, ArticleToken } from '@/types/reading';

export type Segment =
  | { kind: 'annotation'; text: string; annotation: Annotation }
  | { kind: 'word'; text: string; lemma: string }
  | { kind: 'plain'; text: string };

const PRIORITY: Record<Annotation['type'], number> = {
  REDEWENDUNG: 3,
  NOMEN_VERB_VERBINDUNG: 2,
  WORD: 1,
};

/**
 * Merges the two layers the backend sends into one render list: curated annotation spans
 * (character offsets into `content`) and the per-word token list (every word is tappable).
 * Annotated ranges win where they overlap tokens; known annotations are not highlighted; when
 * annotations overlap, the longer-reaching idiom/phrase wins over a single word.
 * Consecutive non-word tokens (spaces, punctuation) are merged into one plain run.
 */
export function buildSegments(
  content: string,
  tokens: ArticleToken[],
  annotations: Annotation[],
): Segment[] {
  const ranges = annotations
    .filter((a) => !a.known)
    .flatMap((a) => a.spans.map((s) => ({ start: s.start, end: s.end, annotation: a })))
    .filter((r) => r.end > r.start && r.start >= 0 && r.end <= content.length)
    .sort((a, b) => a.start - b.start || PRIORITY[b.annotation.type] - PRIORITY[a.annotation.type]);

  const resolved: typeof ranges = [];
  let lastEnd = -1;
  for (const r of ranges) {
    if (r.start < lastEnd) continue; // overlaps a higher-priority/earlier range
    resolved.push(r);
    lastEnd = r.end;
  }

  const sorted = [...tokens].sort((a, b) => a.index - b.index);
  const out: Segment[] = [];
  const pushPlain = (text: string) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last?.kind === 'plain') last.text += text;
    else out.push({ kind: 'plain', text });
  };

  let cursor = 0;
  let t = 0;
  let a = 0;
  while (cursor < content.length) {
    const next = resolved[a];
    if (next && next.start === cursor) {
      out.push({
        kind: 'annotation',
        text: content.slice(next.start, next.end),
        annotation: next.annotation,
      });
      // Skip the tokens covered by the annotation, keeping the token cursor aligned with the text.
      while (t < sorted.length && cursor < next.end) {
        cursor += sorted[t].text.length;
        t++;
      }
      cursor = Math.max(cursor, next.end);
      a++;
      continue;
    }

    const token = sorted[t];
    if (!token) {
      pushPlain(content.slice(cursor));
      break;
    }
    if (token.isWord) out.push({ kind: 'word', text: token.text, lemma: token.lemma });
    else pushPlain(token.text);
    cursor += token.text.length;
    t++;
  }
  return out;
}

/** Distinct, trimmed lemma keys (tapped/saved sets use the annotation's lemma). */
export const lemmaKey = (lemma: string) => lemma.trim();

/** Interface-language name of an annotation type. */
export const annotationLabel = (
  a: { word: string; nounVerb: string; idiom: string },
  type: Annotation['type'],
) => ({ WORD: a.word, NOMEN_VERB_VERBINDUNG: a.nounVerb, REDEWENDUNG: a.idiom })[type];
