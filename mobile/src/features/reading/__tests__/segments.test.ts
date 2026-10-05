import { buildSegments } from '../segments';
import { CONTENT, annotation, makeArticle, tokenize } from '../testing/fixtures';

const text = (segs: ReturnType<typeof buildSegments>) => segs.map((s) => s.text).join('');

describe('buildSegments', () => {
  it('always reproduces the content exactly, with or without annotations', () => {
    const tokens = tokenize(CONTENT);
    expect(text(buildSegments(CONTENT, tokens, []))).toBe(CONTENT);
    expect(text(buildSegments(CONTENT, tokens, makeArticle().annotations))).toBe(CONTENT);
  });

  it('turns every word into a tappable segment and merges spaces/punctuation into plain runs', () => {
    const segs = buildSegments('Hallo, Welt!', tokenize('Hallo, Welt!'), []);
    expect(segs).toEqual([
      { kind: 'word', text: 'Hallo', lemma: 'hallo' },
      { kind: 'plain', text: ', ' },
      { kind: 'word', text: 'Welt', lemma: 'welt' },
      { kind: 'plain', text: '!' },
    ]);
  });

  it('replaces covered words with an annotation segment, including multi-word idioms', () => {
    const segs = buildSegments(CONTENT, tokenize(CONTENT), makeArticle().annotations);
    const annotated = segs.filter((s) => s.kind === 'annotation');
    expect(annotated.map((s) => s.text)).toEqual(['Hund', 'auf dem Schlauch']);
    // Words inside the idiom are no longer separate word segments.
    expect(segs.filter((s) => s.kind === 'word').map((s) => s.text)).not.toContain('Schlauch');
    expect(segs.filter((s) => s.kind === 'word').map((s) => s.text)).toContain('bellt');
  });

  it('does not highlight known annotations', () => {
    const [hund] = makeArticle().annotations;
    const segs = buildSegments(CONTENT, tokenize(CONTENT), [{ ...hund, known: true }]);
    expect(segs.some((s) => s.kind === 'annotation')).toBe(false);
    expect(segs.some((s) => s.kind === 'word' && s.text === 'Hund')).toBe(true);
  });

  it('on overlap, prefers the idiom over a word and drops the loser', () => {
    const word = annotation({
      id: 'w',
      spans: [{ start: 45, end: 48 }],
      surfaceText: 'auf',
      lemma: 'auf',
    });
    const idiom = annotation({
      id: 'i',
      spans: [{ start: 45, end: 61 }],
      type: 'REDEWENDUNG',
      lemma: 'auf dem Schlauch stehen',
    });
    const segs = buildSegments(CONTENT, tokenize(CONTENT), [word, idiom]);
    const ann = segs.filter((s) => s.kind === 'annotation');
    expect(ann).toHaveLength(1);
    expect(ann[0].kind === 'annotation' && ann[0].annotation.id).toBe('i');
    expect(text(segs)).toBe(CONTENT);
  });

  it('supports several spans per annotation and ignores invalid ranges', () => {
    const multi = annotation({
      id: 'm',
      spans: [
        { start: 0, end: 3 },
        { start: 21, end: 23 },
      ],
      lemma: 'x',
    });
    const bad = annotation({
      id: 'b',
      spans: [
        { start: 50, end: 10 },
        { start: -3, end: 2 },
        { start: 5, end: 9999 },
      ],
    });
    const segs = buildSegments(CONTENT, tokenize(CONTENT), [multi, bad]);
    expect(segs.filter((s) => s.kind === 'annotation').map((s) => s.text)).toEqual(['Der', 'Er']);
    expect(text(segs)).toBe(CONTENT);
  });

  it('survives text with umlauts, emoji and missing tokens', () => {
    const c = 'Größe 😀 Äpfel';
    expect(text(buildSegments(c, tokenize(c), []))).toBe(c);
    expect(text(buildSegments(c, [], []))).toBe(c); // no tokens → everything plain
  });
});
