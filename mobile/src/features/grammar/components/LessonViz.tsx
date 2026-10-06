import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { InlineRich, RichBlocks } from '@/components/content/RichContent';
import type { BlockNode, InlineNode } from '@/components/content/parse';
import { AppText } from '@/components/ui';
import { PressableScale, tint } from '@/features/exam/components/kit';
import { colors, radius, shadow, spacing } from '@/theme';
import type { QuizQuestion } from '@/types/grammar';
import { isCorrectAnswer } from '../quiz';

type Dir = 'ltr' | 'rtl';

// ---- content model ----

const inlineText = (nodes: InlineNode[]) =>
  nodes
    .map((n) => (n.t === 'br' ? ' ' : n.text))
    .join('')
    .trim();

export function blockText(block: BlockNode): string {
  switch (block.t) {
    case 'p':
    case 'h':
      return inlineText(block.inlines);
    case 'list':
      return block.items.map((item) => item.map(blockText).join(' ')).join(' ');
    case 'quote':
      return block.blocks.map(blockText).join(' ');
    case 'code':
      return block.text;
    default:
      return '';
  }
}

export type LessonSection = { title: string | null; blocks: BlockNode[] };

/** Splits lesson content at its headings (h1–h3); text before the first heading is the intro. */
export function splitSections(blocks: BlockNode[]): LessonSection[] {
  const sections: LessonSection[] = [];
  let current: LessonSection = { title: null, blocks: [] };
  for (const block of blocks) {
    if (block.t === 'h' && block.level <= 3) {
      if (current.title !== null || current.blocks.length > 0) sections.push(current);
      current = { title: blockText(block), blocks: [] };
    } else {
      current.blocks.push(block);
    }
  }
  if (current.title !== null || current.blocks.length > 0) sections.push(current);
  return sections;
}

// ---- collapsible section ----

/** A numbered, collapsible lesson step. Opening it counts as "explored". */
export function SectionCard({
  index,
  title,
  open,
  onToggle,
  children,
}: {
  index: number;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={styles.sectionHead}
      >
        <View style={[styles.badge, open && { backgroundColor: colors.primary }]}>
          <AppText style={[styles.badgeText, open && { color: '#FFFFFF' }]}>{index}</AppText>
        </View>
        <AppText variant="subheading" style={{ flex: 1 }}>
          {title}
        </AppText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.mutedForeground}
        />
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

// ---- interactive table ----

/** Tap a row to spotlight it (the others fade); tap again to clear. Great for conjugation tables. */
export function InteractiveTable({
  rows,
  dir,
}: {
  rows: { header: boolean; cells: BlockNode[][] }[];
  dir: Dir;
}) {
  const { width } = useWindowDimensions();
  const [focus, setFocus] = useState<number | null>(null);
  const cols = Math.max(1, ...rows.map((r) => r.cells.length));
  const available = width - 2 * spacing.lg - 2 * spacing.lg;
  const colWidth = Math.max(104, Math.floor(available / cols));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="none">
      <View style={styles.table}>
        {rows.map((row, r) => {
          const selected = focus === r;
          const faded = focus !== null && !selected && !row.header;
          return (
            <Pressable
              key={r}
              disabled={row.header}
              accessibilityRole={row.header ? undefined : 'button'}
              accessibilityState={{ selected }}
              onPress={() => setFocus(selected ? null : r)}
              style={[
                styles.tr,
                row.header && styles.trHead,
                !row.header && r % 2 === 0 && { backgroundColor: colors.background },
                selected && styles.trSelected,
                faded && { opacity: 0.45 },
              ]}
            >
              {row.cells.map((cell, c) => (
                <View
                  key={c}
                  style={[styles.td, { width: colWidth }, c === 0 && !row.header && styles.tdFirst]}
                >
                  <RichBlocks blocks={cell} dir={dir} bold={row.header || c === 0} />
                </View>
              ))}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ---- examples ----

/** One example sentence as a speech bubble. */
export function ExampleBubble({ blocks, dir }: { blocks: BlockNode[]; dir: Dir }) {
  return (
    <View style={styles.bubble}>
      <RichBlocks blocks={blocks} dir={dir} />
    </View>
  );
}

/** Lists become one bubble per item, paragraphs one each; anything else is shown as is. */
export function toExampleBubbles(blocks: BlockNode[]): BlockNode[][] {
  const out: BlockNode[][] = [];
  for (const b of blocks) {
    if (b.t === 'list') for (const item of b.items) out.push(item);
    else if (b.t === 'p' || b.t === 'quote') out.push([b]);
    else out.push([b]);
  }
  return out;
}

// ---- tip ----

export function TipCallout({ children }: { children: ReactNode }) {
  return (
    <View style={styles.tip}>
      <View style={styles.tipIcon}>
        <Ionicons name="bulb" size={20} color={colors.warning} />
      </View>
      <View style={{ flex: 1, gap: spacing.xs }}>{children}</View>
    </View>
  );
}

// ---- quick check ----

/** One real quiz question inline: answer right away, get instant feedback. */
export function QuickCheck({
  question,
  title,
  text,
  dir,
}: {
  question: QuizQuestion;
  title: string;
  text: string;
  dir: Dir;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const options =
    question.type === 'truefalse'
      ? [
          { value: 'true', label: 'Richtig' },
          { value: 'false', label: 'Falsch' },
        ]
      : (question.options ?? []).filter((o) => o.trim()).map((o) => ({ value: o, label: o }));
  const answered = picked !== null;
  const correct = answered && isCorrectAnswer(question, picked);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '700' }}>
          {title.toUpperCase()}
        </AppText>
        <InlineRich content={text} dir={dir} style={{ fontWeight: '600' }} />
      </View>
      <View style={{ gap: spacing.sm }}>
        {options.map((o) => {
          const isPicked = picked === o.value;
          const isRight = answered && isCorrectAnswer(question, o.value);
          const bg = isRight
            ? colors.successSoft
            : isPicked
              ? colors.destructiveSoft
              : colors.surface;
          const border = isRight ? colors.success : isPicked ? colors.destructive : colors.border;
          return (
            <PressableScale
              key={o.value}
              disabled={answered}
              accessibilityRole="button"
              accessibilityLabel={`Antwort: ${o.label}`}
              accessibilityState={{ selected: isPicked, disabled: answered }}
              onPress={() => setPicked(o.value)}
              style={[styles.option, { backgroundColor: bg, borderColor: border }]}
            >
              <AppText style={{ flex: 1, fontWeight: '600' }}>{o.label}</AppText>
              {answered && (isRight || isPicked) ? (
                <Ionicons
                  name={isRight ? 'checkmark-circle' : 'close-circle'}
                  size={22}
                  color={isRight ? colors.success : colors.destructive}
                />
              ) : null}
            </PressableScale>
          );
        })}
      </View>
      {answered ? (
        <View accessibilityRole="alert" style={styles.feedbackRow}>
          <AppText
            style={{ fontWeight: '700' }}
            color={correct ? colors.success : colors.destructive}
          >
            {correct ? '🎉 Richtig!' : 'Nicht ganz – die richtige Antwort ist markiert.'}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nochmal versuchen"
            onPress={() => setPicked(null)}
          >
            <AppText color={colors.primaryDark} style={{ fontWeight: '700' }}>
              Nochmal
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    minHeight: 64,
  },
  sectionBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  badgeText: { fontWeight: '800', color: colors.primaryDark },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  trHead: { backgroundColor: colors.accent },
  trSelected: { backgroundColor: tint(colors.primary, '33') },
  td: { padding: spacing.md, justifyContent: 'center' },
  tdFirst: { backgroundColor: tint(colors.primary, '14') },
  bubble: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    borderTopLeftRadius: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tip: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warningSoft,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFFAA',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
