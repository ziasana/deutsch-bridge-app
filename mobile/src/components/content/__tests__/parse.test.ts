import { normalizeLessonMarkdown, parseBlocks, parseInline, resolveUploadUrl } from '../parse';

const text = (b: ReturnType<typeof parseBlocks>[number]) =>
  b.t === 'p' || b.t === 'h' ? b.inlines.map((n) => (n.t === 'text' ? n.text : '\n')).join('') : '';

describe('parseBlocks – markdown', () => {
  it('parses headings, paragraphs and emphasis', () => {
    const blocks = parseBlocks('## Perfekt\n\nIch **habe** *gegessen* und `code`.');
    expect(blocks[0]).toMatchObject({ t: 'h', level: 2 });
    expect(text(blocks[0])).toBe('Perfekt');
    const p = blocks[1];
    expect(p.t).toBe('p');
    if (p.t === 'p') {
      expect(p.inlines).toContainEqual({ t: 'text', text: 'habe', bold: true });
      expect(p.inlines).toContainEqual({ t: 'text', text: 'gegessen', italic: true });
      expect(p.inlines).toContainEqual({ t: 'text', text: 'code', code: true });
    }
  });

  it('parses ordered/unordered lists, quotes and rules', () => {
    const blocks = parseBlocks('- a\n- b\n\n1. eins\n2. zwei\n\n> Merke\n\n---');
    expect(blocks.map((b) => b.t)).toEqual(['list', 'list', 'quote', 'hr']);
    expect(blocks[0]).toMatchObject({ ordered: false });
    expect(blocks[1]).toMatchObject({ ordered: true });
    if (blocks[0].t === 'list') expect(blocks[0].items).toHaveLength(2);
  });

  it('parses GFM tables with a header row', () => {
    const [table] = parseBlocks('| Person | Form |\n|---|---|\n| ich | habe |\n| du | hast |');
    expect(table.t).toBe('table');
    if (table.t === 'table') {
      expect(table.rows).toHaveLength(3);
      expect(table.rows[0].header).toBe(true);
      expect(table.rows[1].header).toBe(false);
      expect(table.rows[2].cells).toHaveLength(2);
    }
  });

  it('rebuilds lessons whose line breaks were stripped', () => {
    const flat = `${'Einleitung. '.repeat(20)} ## Regel Hier steht die Regel. | A | B | |---|---| | 1 | 2 | | 3 | 4 |`;
    const blocks = parseBlocks(flat);
    expect(blocks.some((b) => b.t === 'h')).toBe(true);
    expect(blocks.some((b) => b.t === 'table')).toBe(true);
    expect(normalizeLessonMarkdown('short')).toBe('short');
  });
});

describe('parseBlocks – rich-text HTML', () => {
  it('handles editor HTML: paragraphs, formatting, lists and nested content', () => {
    const blocks = parseBlocks(
      '<h2>Regel</h2><p>Das <strong>Verb</strong> steht <u>hier</u>.</p><ul><li><p>eins</p></li><li>zwei <em>x</em></li></ul>',
    );
    expect(blocks.map((b) => b.t)).toEqual(['h', 'p', 'list']);
    if (blocks[2].t === 'list') {
      expect(blocks[2].items).toHaveLength(2);
      expect(blocks[2].items[1][0].t).toBe('p');
    }
  });

  it('renders HTML tables and keeps cell content', () => {
    const [table] = parseBlocks(
      '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>x</td></tr></tbody></table>',
    );
    expect(table.t).toBe('table');
    if (table.t === 'table') expect(table.rows.map((r) => r.header)).toEqual([true, false]);
  });

  it('resolves upload images and drops unsafe ones', () => {
    const blocks = parseBlocks(
      '<img src="/uploads/a.png" alt="A"><img src="javascript:alert(1)"><img src="data:image/png;base64,AAAA">',
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ t: 'img', alt: 'A' });
    if (blocks[0].t === 'img') expect(blocks[0].src).toMatch(/^https?:\/\/.+\/uploads\/a\.png$/);
    expect(resolveUploadUrl('https://x.de/a.png')).toBe('https://x.de/a.png');
  });

  it('only keeps http(s)/mailto links and never emits scripts', () => {
    const [p] = parseBlocks(
      '<p><a href="https://example.com">ok</a> <a href="javascript:evil()">bad</a><script>alert(1)</script></p>',
    );
    if (p.t !== 'p') throw new Error('expected paragraph');
    const links = p.inlines.filter((n) => n.t === 'text' && n.href);
    expect(links).toHaveLength(1);
    expect(JSON.stringify(p.inlines)).not.toContain('alert');
  });

  it('returns nothing for empty content', () => {
    expect(parseBlocks('')).toEqual([]);
    expect(parseBlocks(null)).toEqual([]);
    expect(parseBlocks('   ')).toEqual([]);
  });
});

describe('parseInline', () => {
  it('keeps inline emphasis and strips paragraph wrappers', () => {
    expect(parseInline('Ich **bin** hier')).toEqual([
      { t: 'text', text: 'Ich ' },
      { t: 'text', text: 'bin', bold: true },
      { t: 'text', text: ' hier' },
    ]);
    expect(parseInline('')).toEqual([]);
  });
});
