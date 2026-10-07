import { Image } from 'expo-image';
import { createContext, useContext, useId, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { detectDir, ltrText, rtlText } from '@/i18n/direction';
import { HorizontalScroll } from '@/components/ui/HorizontalScroll';
import { colors, radius, spacing } from '@/theme';
import { WordTapContext, splitWords } from './WordTap';
import { parseBlocks, parseInline, type BlockNode, type InlineNode } from './parse';

type Direction = 'ltr' | 'rtl';

/** Text size multiplier for everything rendered below it (default 1). */
export const ContentScale = createContext(1);

/** Scales the font size and line height of a style (or style array) by the current multiplier. */
function useScaled(base: object | object[]) {
  const scale = useContext(ContentScale);
  if (scale === 1) return base;
  const flat = StyleSheet.flatten(base) as { fontSize?: number; lineHeight?: number };
  return [
    base,
    {
      fontSize: Math.round((flat.fontSize ?? 16) * scale),
      lineHeight: Math.round((flat.lineHeight ?? (flat.fontSize ?? 16) * 1.5) * scale),
    },
  ];
}

function Inlines({ nodes, base }: { nodes: InlineNode[]; base: object }) {
  const scaled = useScaled(base);
  const tap = useContext(WordTapContext);
  const scope = useId();
  // Every tappable word of this paragraph in order, so a tap knows its position and neighbours.
  const words: string[] = [];
  let position = 0;
  return (
    <Text style={scaled}>
      {nodes.map((n, i) => {
        if (n.t === 'br') return '\n';
        const style = [
          n.bold && styles.bold,
          n.italic && styles.italic,
          n.code && styles.code,
          n.underline && styles.underline,
          n.strike && styles.strike,
          n.href ? styles.link : null,
        ];
        if (!tap || n.href || n.code) {
          return (
            <Text
              key={i}
              style={style}
              onPress={n.href ? () => void Linking.openURL(n.href!) : undefined}
              accessibilityRole={n.href ? 'link' : undefined}
            >
              {n.text}
            </Text>
          );
        }
        const sel = tap.selection?.scope === scope ? tap.selection : null;
        return (
          <Text key={i} style={style}>
            {splitWords(n.text).map((part, j) => {
              if (!part.word) return part.text;
              const index = position++;
              words[index] = part.text;
              const picked = !!sel && index >= sel.from && index <= sel.to;
              return (
                <Text
                  key={j}
                  suppressHighlighting
                  style={picked ? styles.picked : undefined}
                  onPress={() => tap.onTap(scope, index, words)}
                >
                  {part.text}
                </Text>
              );
            })}
          </Text>
        );
      })}
    </Text>
  );
}

const HEADING_STYLE = [
  styles_h(26),
  styles_h(22),
  styles_h(19),
  styles_h(17),
  styles_h(16),
  styles_h(16),
];
function styles_h(size: number) {
  return {
    fontSize: size,
    lineHeight: Math.round(size * 1.3),
    fontWeight: '700' as const,
    color: colors.foreground,
  };
}

const inlineText = (nodes: InlineNode[]) =>
  nodes.map((n) => (n.t === 'text' ? n.text : ' ')).join('');

/** Plain text of a block, for sniffing its direction. */
function blockText(b: BlockNode): string {
  switch (b.t) {
    case 'p':
    case 'h':
      return inlineText(b.inlines);
    case 'list':
      return b.items.map((item) => item.map(blockText).join(' ')).join(' ');
    case 'quote':
      return b.blocks.map(blockText).join(' ');
    case 'table':
      return b.rows.map((r) => r.cells.map((c) => c.map(blockText).join(' ')).join(' ')).join(' ');
    default:
      return '';
  }
}

function Blocks({ blocks, dir }: { blocks: BlockNode[]; dir: Direction }) {
  // `dir` is the lesson's language direction, used only where a block has no letters to go by.
  // Each block takes its own direction, like the web renderer: a Persian lesson keeps its German
  // example sentences left-to-right, and a German lesson keeps any Persian note right-to-left.
  const textOf = (b: BlockNode) => detectDir(blockText(b), dir);
  return (
    <View style={[styles.stack, { direction: dir }]}>
      {blocks.map((b, i) => {
        const bd = textOf(b);
        const align = bd === 'rtl' ? rtlText : ltrText;
        switch (b.t) {
          case 'p':
            return (
              <View key={i} style={{ direction: bd }}>
                <Inlines nodes={b.inlines} base={[styles.body, align]} />
              </View>
            );
          case 'h':
            return (
              <View key={i} accessibilityRole="header" style={{ direction: bd }}>
                <Inlines nodes={b.inlines} base={[HEADING_STYLE[b.level - 1], align]} />
              </View>
            );
          case 'list':
            return (
              <View key={i} style={styles.list}>
                {b.items.map((item, j) => (
                  <View
                    key={j}
                    style={[
                      styles.item,
                      { direction: detectDir(item.map(blockText).join(' '), dir) },
                    ]}
                  >
                    <Text style={[styles.body, styles.marker]}>
                      {b.ordered ? `${j + 1}.` : '•'}
                    </Text>
                    <View style={styles.flex}>
                      <Blocks blocks={item} dir={dir} />
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'quote':
            return (
              <View key={i} style={styles.quote}>
                <Blocks blocks={b.blocks} dir={dir} />
              </View>
            );
          case 'hr':
            return <View key={i} style={styles.hr} />;
          case 'code':
            return (
              <View key={i} style={styles.pre}>
                <Text style={styles.codeBlock}>{b.text}</Text>
              </View>
            );
          case 'img':
            return (
              <Image
                key={i}
                source={{ uri: b.src }}
                accessibilityLabel={b.alt || undefined}
                contentFit="contain"
                style={styles.img}
              />
            );
          case 'table':
            return (
              <HorizontalScroll
                key={i}
                horizontal
                showsHorizontalScrollIndicator
                accessibilityRole="none"
              >
                <View style={styles.table}>
                  {b.rows.map((row, r) => (
                    <View key={r} style={[styles.row, row.header && styles.headerRow]}>
                      {row.cells.map((cell, c) => (
                        <View
                          key={c}
                          style={[
                            styles.cell,
                            c === row.cells.length - 1 && { borderRightWidth: 0 },
                          ]}
                        >
                          {row.header ? (
                            <Boldened blocks={cell} dir={dir} />
                          ) : (
                            <Blocks blocks={cell} dir={dir} />
                          )}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </HorizontalScroll>
            );
        }
      })}
    </View>
  );
}

/** Header cells are bold even when the source didn't say so. */
function Boldened({ blocks, dir }: { blocks: BlockNode[]; dir: Direction }) {
  const bolded: BlockNode[] = blocks.map((b) =>
    b.t === 'p'
      ? { ...b, inlines: b.inlines.map((n) => (n.t === 'text' ? { ...n, bold: true } : n)) }
      : b,
  );
  return <Blocks blocks={bolded} dir={dir} />;
}

/** Renders already-parsed blocks, for screens that lay the content out in their own widgets. */
export function RichBlocks({
  blocks,
  dir = 'ltr',
  bold,
}: {
  blocks: BlockNode[];
  dir?: Direction;
  bold?: boolean;
}) {
  return bold ? <Boldened blocks={blocks} dir={dir} /> : <Blocks blocks={blocks} dir={dir} />;
}

/** Lesson content: Markdown and/or rich-text HTML, rendered natively. */
export function RichContent({
  content,
  dir = 'ltr',
  highlightable,
}: {
  content: string | null | undefined;
  dir?: Direction;
  /** Tapping a paragraph marks it like a highlighter pen (tap again to clear). */
  highlightable?: boolean;
}) {
  const [marked, setMarked] = useState<ReadonlySet<number>>(new Set());
  const blocks = parseBlocks(content);
  if (blocks.length === 0) return null;
  if (!highlightable) return <Blocks blocks={blocks} dir={dir} />;
  const toggle = (i: number) =>
    setMarked((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });
  return (
    <View style={[styles.stack, { direction: dir }]}>
      {blocks.map((b, i) =>
        b.t === 'p' ? (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={marked.has(i) ? 'Markierung entfernen' : 'Absatz markieren'}
            onPress={() => toggle(i)}
            style={[styles.para, marked.has(i) && styles.marked]}
          >
            <Blocks blocks={[b]} dir={dir} />
          </Pressable>
        ) : (
          <Blocks key={i} blocks={[b]} dir={dir} />
        ),
      )}
    </View>
  );
}

/** One line with inline emphasis (quiz question, option, answer). */
export function InlineRich({
  content,
  style,
  dir = 'ltr',
}: {
  content: string;
  style?: object;
  dir?: Direction;
}) {
  const align = detectDir(content, dir) === 'rtl' ? rtlText : ltrText;
  return <Inlines nodes={parseInline(content)} base={[styles.body, style, align]} />;
}

const styles = StyleSheet.create({
  picked: { backgroundColor: '#CFE2FF', color: colors.primaryDark },
  stack: { gap: spacing.sm },
  para: {
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  marked: { backgroundColor: '#FFF0A6' },
  flex: { flex: 1 },
  body: { fontSize: 16, lineHeight: 25, color: colors.foreground },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
  strike: { textDecorationLine: 'line-through' },
  code: { fontFamily: 'Courier', backgroundColor: colors.muted },
  link: { color: colors.primaryDark },
  list: { gap: spacing.xs },
  item: { flexDirection: 'row', gap: spacing.sm },
  marker: { minWidth: 18 },
  quote: {
    borderStartWidth: 4,
    borderStartColor: colors.accent,
    paddingStart: spacing.md,
    opacity: 0.9,
  },
  hr: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  pre: { backgroundColor: colors.muted, borderRadius: radius.sm, padding: spacing.md },
  codeBlock: { fontFamily: 'Courier', fontSize: 14, color: colors.foreground },
  img: { width: '100%', height: 200 },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  headerRow: { backgroundColor: colors.accent },
  cell: { width: 150, padding: spacing.sm, borderRightWidth: 1, borderRightColor: colors.border },
});
