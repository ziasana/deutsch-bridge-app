import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { ExamPassagePublic } from '@/types/exam';
import { resolveUploadUrl } from '@/utils/urls';
import { optionLabelFor, withGapMarkers } from '../content';
import { AudioClip } from './AudioClip';
import { tint } from './kit';

export function PassageBody({ passage }: { passage: ExamPassagePublic }) {
  const audio = resolveUploadUrl(passage.audioUrl);
  const image = resolveUploadUrl(passage.imageUrl);
  return (
    <View style={{ gap: spacing.sm }}>
      {audio ? <AudioClip key={audio} src={audio} label={passage.label} /> : null}
      {image ? (
        <Image
          source={{ uri: image }}
          contentFit="contain"
          style={styles.image}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      {passage.content ? <RichContent content={withGapMarkers(passage.content)} /> : null}
    </View>
  );
}

/**
 * The text a question refers to, in a card that can be folded away. Open by default so the learner
 * reads first; folding it gives the options the whole screen.
 */
export function ReadingCard({
  passages,
  title,
  color,
  defaultOpen = true,
  icon = 'book-outline',
  extra,
}: {
  passages: ExamPassagePublic[];
  title?: string;
  color: string;
  defaultOpen?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Rendered inside the card under the text (e.g. the headline pool). */
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const heading = title ?? (passages.length === 1 ? passages[0].label : 'Text');
  return (
    <View style={[styles.reading, { borderColor: tint(color, '33') }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${heading} ${open ? 'ausblenden' : 'anzeigen'}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={[styles.readingHead, { backgroundColor: tint(color, '14') }]}
      >
        <Ionicons name={icon} size={20} color={color} />
        <AppText variant="subheading" style={{ flex: 1 }}>
          {heading}
        </AppText>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.mutedForeground} />
      </Pressable>
      {open ? (
        <View style={styles.readingBody}>
          {passages.map((p) => (
            <View key={p.id} style={{ gap: spacing.xs }}>
              {passages.length > 1 ? (
                <AppText variant="caption" color={color} style={{ fontWeight: '700' }}>
                  {p.label.toUpperCase()}
                </AppText>
              ) : null}
              <PassageBody passage={p} />
            </View>
          ))}
          {extra}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Shared pool the answers are chosen from. Words / headlines already used by an answer are dimmed
 * and struck through so the learner sees at a glance what is left.
 */
export function WordBank({
  answerOptions,
  labels,
  color,
  used,
  title,
}: {
  answerOptions: string[];
  labels: string[] | null;
  color: string;
  used?: Set<string>;
  title: string;
}) {
  if (answerOptions.length === 0) return null;
  return (
    <View style={[styles.bank, { borderColor: tint(color, '33') }]}>
      <AppText variant="small" color={colors.mutedForeground} style={{ fontWeight: '600' }}>
        {title}
      </AppText>
      <View style={styles.chips}>
        {answerOptions.map((option, i) => {
          const gone = used?.has(option);
          return (
            <View
              key={`${i}-${option}`}
              accessible
              accessibilityLabel={`${optionLabelFor(labels, i)}: ${option}${gone ? ', benutzt' : ''}`}
              style={[styles.wordChip, { backgroundColor: tint(color, '14') }, gone && { opacity: 0.4 }]}
            >
              <AppText style={[styles.wordLetter, { color }]}>{optionLabelFor(labels, i)}</AppText>
              <AppText style={gone ? { textDecorationLine: 'line-through' } : undefined}>{option}</AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.muted },
  reading: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  readingHead: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  readingBody: { padding: spacing.lg, gap: spacing.md },
  bank: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  wordLetter: { fontWeight: '800' },
});
