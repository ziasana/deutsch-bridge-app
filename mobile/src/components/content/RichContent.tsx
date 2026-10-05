import { Image } from 'expo-image';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { parseBlocks, parseInline, type BlockNode, type InlineNode } from './parse';

type Direction = 'ltr' | 'rtl';

function Inlines({ nodes, base }: { nodes: InlineNode[]; base: object }) {
  return (
    <Text style={base}>
      {nodes.map((n, i) => {
        if (n.t === 'br') return '\n';
        return (
          <Text
            key={i}
            style={[
              n.bold && styles.bold,
              n.italic && styles.italic,
              n.code && styles.code,
              n.underline && styles.underline,
              n.strike && styles.strike,
              n.href ? styles.link : null,
            ]}
            onPress={n.href ? () => void Linking.openURL(n.href!) : undefined}
            accessibilityRole={n.href ? 'link' : undefined}
          >
            {n.text}
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

function Blocks({ blocks, dir }: { blocks: BlockNode[]; dir: Direction }) {
  const align =
    dir === 'rtl' ? { textAlign: 'right' as const, writingDirection: 'rtl' as const } : null;
  return (
    <View style={styles.stack}>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'p':
            return <Inlines key={i} nodes={b.inlines} base={[styles.body, align]} />;
          case 'h':
            return (
              <View key={i} accessibilityRole="header">
                <Inlines nodes={b.inlines} base={[HEADING_STYLE[b.level - 1], align]} />
              </View>
            );
          case 'list':
            return (
              <View key={i} style={styles.list}>
                {b.items.map((item, j) => (
                  <View
                    key={j}
                    style={[styles.item, dir === 'rtl' && { flexDirection: 'row-reverse' }]}
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
              <ScrollView
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
              </ScrollView>
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

/** Lesson content: Markdown and/or rich-text HTML, rendered natively. */
export function RichContent({
  content,
  dir = 'ltr',
}: {
  content: string | null | undefined;
  dir?: Direction;
}) {
  const blocks = parseBlocks(content);
  if (blocks.length === 0) return null;
  return <Blocks blocks={blocks} dir={dir} />;
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
  const align =
    dir === 'rtl' ? { textAlign: 'right' as const, writingDirection: 'rtl' as const } : null;
  return <Inlines nodes={parseInline(content)} base={[styles.body, style, align]} />;
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
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
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    paddingLeft: spacing.md,
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
