import { parseDocument } from 'htmlparser2';
import type { ChildNode, Element } from 'domhandler';
import { marked } from 'marked';
import { env } from '@/config/env';

/**
 * Lesson text is Markdown (GFM tables included), rich-text HTML from the admin editor, or a mix.
 * Everything is turned into HTML with `marked` (which leaves existing HTML intact) and then parsed
 * into a small, safe block/inline tree. Nothing is ever executed or injected as raw HTML.
 */

export type InlineNode =
  | {
      t: 'text';
      text: string;
      bold?: boolean;
      italic?: boolean;
      code?: boolean;
      underline?: boolean;
      strike?: boolean;
      href?: string;
    }
  | { t: 'br' };

export type BlockNode =
  | { t: 'p'; inlines: InlineNode[] }
  | { t: 'h'; level: number; inlines: InlineNode[] }
  | { t: 'list'; ordered: boolean; items: BlockNode[][] }
  | { t: 'quote'; blocks: BlockNode[] }
  | { t: 'hr' }
  | { t: 'code'; text: string }
  | { t: 'img'; src: string; alt: string }
  | { t: 'table'; rows: { header: boolean; cells: BlockNode[][] }[] };

// ---- normalisation (ported from the web app) ----

function looksFlattened(text: string): boolean {
  if (/<\/?[a-z][\s\S]*>/i.test(text)) return false;
  const newlines = (text.match(/\n/g) ?? []).length;
  return newlines < 2 && text.length > 200;
}

function reconstructTables(text: string): string {
  return text.replace(/\|(?:[^|\n]*\|)+/g, (blob) => {
    const inner = blob
      .split('|')
      .map((c) => c.trim())
      .slice(1, -1);
    const dashIndex = inner.findIndex((c) => /^:?-{2,}:?$/.test(c));
    const columns = dashIndex - 1;
    if (columns < 1) return blob;
    const rows: string[][] = [];
    let i = 0;
    while (i + columns <= inner.length) {
      rows.push(inner.slice(i, i + columns));
      i += columns;
      if (inner[i] === '') i += 1;
    }
    if (rows.length < 2) return blob;
    return `\n\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n\n`;
  });
}

/** Some bulk-imported lessons lost their line breaks; put headings, lists and tables back on their own lines. */
export function normalizeLessonMarkdown(text: string): string {
  if (!text || !looksFlattened(text)) return text;
  return reconstructTables(text)
    .replace(/\s+(#{1,6}\s)/g, '\n\n$1')
    .replace(/\s+(>\s)/g, '\n\n$1')
    .replace(/\s+(\*\*\d+\.\s)/g, '\n\n$1')
    .replace(/\s+(-\s\*\*)/g, '\n$1');
}

/** Backend-relative "/uploads/..." paths become absolute so images load on a device. */
export function resolveUploadUrl(url: string): string {
  return url.startsWith('/uploads/') ? `${env.apiOrigin}${url}` : url;
}

const isSafeUrl = (url: string) => /^(https?:\/\/|mailto:)/i.test(url);
const isImageUrl = (url: string) => /^https?:\/\//i.test(url);

// ---- HTML → tree ----

type Style = Omit<Extract<InlineNode, { t: 'text' }>, 't' | 'text'>;

const BLOCK_TAGS = new Set([
  'p',
  'div',
  'section',
  'article',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'pre',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'img',
  'figure',
]);

const isElement = (n: ChildNode): n is Element =>
  n.type === 'tag' || n.type === 'script' || n.type === 'style';

function collectInlines(nodes: ChildNode[], style: Style, out: InlineNode[]): void {
  for (const node of nodes) {
    if (node.type === 'text') {
      const text = node.data.replace(/\s+/g, ' ');
      if (text) out.push({ t: 'text', text, ...style });
    } else if (isElement(node)) {
      const tag = node.name.toLowerCase();
      if (tag === 'script' || tag === 'style') continue;
      if (tag === 'br') out.push({ t: 'br' });
      else if (tag === 'strong' || tag === 'b')
        collectInlines(node.children, { ...style, bold: true }, out);
      else if (tag === 'em' || tag === 'i')
        collectInlines(node.children, { ...style, italic: true }, out);
      else if (tag === 'u') collectInlines(node.children, { ...style, underline: true }, out);
      else if (tag === 's' || tag === 'del' || tag === 'strike')
        collectInlines(node.children, { ...style, strike: true }, out);
      else if (tag === 'code') collectInlines(node.children, { ...style, code: true }, out);
      else if (tag === 'a') {
        const href = node.attribs.href;
        collectInlines(
          node.children,
          href && isSafeUrl(href) ? { ...style, href, underline: true } : style,
          out,
        );
      } else collectInlines(node.children, style, out); // span, mark, sup… keep the text
    }
  }
}

function trimInlines(inlines: InlineNode[]): InlineNode[] {
  const out = [...inlines];
  const first = out[0];
  if (first?.t === 'text') out[0] = { ...first, text: first.text.replace(/^\s+/, '') };
  const lastIndex = out.length - 1;
  const last = out[lastIndex];
  if (last?.t === 'text') out[lastIndex] = { ...last, text: last.text.replace(/\s+$/, '') };
  return out.filter((n) => n.t === 'br' || n.text !== '');
}

const hasText = (inlines: InlineNode[]) =>
  inlines.some((n) => n.t === 'text' && n.text.trim() !== '');

/** Children of a block container: runs of inline content become paragraphs, block tags become blocks. */
function collectBlocks(nodes: ChildNode[], out: BlockNode[]): void {
  let run: ChildNode[] = [];
  const flush = () => {
    if (run.length === 0) return;
    const inlines: InlineNode[] = [];
    collectInlines(run, {}, inlines);
    const trimmed = trimInlines(inlines);
    if (hasText(trimmed)) out.push({ t: 'p', inlines: trimmed });
    run = [];
  };

  for (const node of nodes) {
    if (isElement(node) && BLOCK_TAGS.has(node.name.toLowerCase())) {
      flush();
      blockFromElement(node, out);
    } else {
      run.push(node);
    }
  }
  flush();
}

function textOf(nodes: ChildNode[]): string {
  return nodes
    .map((n) => (n.type === 'text' ? n.data : isElement(n) ? textOf(n.children) : ''))
    .join('');
}

function blockFromElement(el: Element, out: BlockNode[]): void {
  const tag = el.name.toLowerCase();
  switch (tag) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const inlines: InlineNode[] = [];
      collectInlines(el.children, {}, inlines);
      const trimmed = trimInlines(inlines);
      if (hasText(trimmed)) out.push({ t: 'h', level: Number(tag[1]), inlines: trimmed });
      return;
    }
    case 'p': {
      const inlines: InlineNode[] = [];
      // A paragraph may still hold block children (e.g. an <img>); handle those separately.
      const inlineKids = el.children.filter(
        (c) => !(isElement(c) && BLOCK_TAGS.has(c.name.toLowerCase())),
      );
      collectInlines(inlineKids, {}, inlines);
      const trimmed = trimInlines(inlines);
      if (hasText(trimmed)) out.push({ t: 'p', inlines: trimmed });
      for (const c of el.children)
        if (isElement(c) && BLOCK_TAGS.has(c.name.toLowerCase())) blockFromElement(c, out);
      return;
    }
    case 'ul':
    case 'ol': {
      const items: BlockNode[][] = [];
      for (const li of el.children) {
        if (isElement(li) && li.name.toLowerCase() === 'li') {
          const blocks: BlockNode[] = [];
          collectBlocks(li.children, blocks);
          if (blocks.length) items.push(blocks);
        }
      }
      if (items.length) out.push({ t: 'list', ordered: tag === 'ol', items });
      return;
    }
    case 'blockquote': {
      const blocks: BlockNode[] = [];
      collectBlocks(el.children, blocks);
      if (blocks.length) out.push({ t: 'quote', blocks });
      return;
    }
    case 'hr':
      out.push({ t: 'hr' });
      return;
    case 'pre': {
      const text = textOf(el.children).replace(/\n$/, '');
      if (text) out.push({ t: 'code', text });
      return;
    }
    case 'img': {
      const src = resolveUploadUrl(el.attribs.src ?? '');
      if (isImageUrl(src)) out.push({ t: 'img', src, alt: el.attribs.alt ?? '' });
      return;
    }
    case 'table': {
      const rows: { header: boolean; cells: BlockNode[][] }[] = [];
      const visit = (nodes: ChildNode[]) => {
        for (const n of nodes) {
          if (!isElement(n)) continue;
          const name = n.name.toLowerCase();
          if (name === 'tr') {
            const cells: BlockNode[][] = [];
            let header = false;
            for (const c of n.children) {
              if (
                isElement(c) &&
                (c.name.toLowerCase() === 'td' || c.name.toLowerCase() === 'th')
              ) {
                if (c.name.toLowerCase() === 'th') header = true;
                const blocks: BlockNode[] = [];
                collectBlocks(c.children, blocks);
                cells.push(blocks);
              }
            }
            if (cells.length) rows.push({ header, cells });
          } else visit(n.children);
        }
      };
      visit(el.children);
      if (rows.length) out.push({ t: 'table', rows });
      return;
    }
    default: // div, section, figure, li (stray), thead… are just containers
      collectBlocks(el.children, out);
  }
}

export function parseBlocks(content: string | null | undefined): BlockNode[] {
  if (!content?.trim()) return [];
  const html = marked.parse(normalizeLessonMarkdown(content), {
    async: false,
    gfm: true,
  }) as string;
  const out: BlockNode[] = [];
  collectBlocks(parseDocument(html).children, out);
  return out;
}

/** One line of text with inline emphasis only (quiz questions, option labels). */
export function parseInline(content: string | null | undefined): InlineNode[] {
  if (!content) return [];
  const html = marked.parseInline(content, { async: false, gfm: true }) as string;
  const out: InlineNode[] = [];
  collectInlines(parseDocument(html).children, {}, out);
  return trimInlines(out);
}
