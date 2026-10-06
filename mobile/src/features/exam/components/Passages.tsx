import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import { parseBlocks, type BlockNode } from '@/components/content/parse';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { ExamPassagePublic } from '@/types/exam';
import { speakGerman } from '@/utils/germanSpeech';
import { resolveUploadUrl } from '@/utils/urls';
import { optionLabelFor, withGapMarkers } from '../content';
import { BODY_LINE, BODY_SIZE, scaledText, useExamTextScale } from '../textScale';
import { AudioClip } from './AudioClip';
import { tint } from './kit';

export function PassageBody({
  passage,
  highlightable,
}: {
  passage: ExamPassagePublic;
  highlightable?: boolean;
}) {
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
      {passage.content ? (
        <RichContent content={withGapMarkers(passage.content)} highlightable={highlightable} />
      ) : null}
    </View>
  );
}

const blockText = (b: BlockNode): string => {
  switch (b.t) {
    case 'p':
    case 'h':
      return b.inlines.map((n) => (n.t === 'text' ? n.text : ' ')).join('');
    case 'list':
      return b.items.map((item) => item.map(blockText).join(' ')).join('. ');
    case 'quote':
      return b.blocks.map(blockText).join(' ');
    default:
      return '';
  }
};

/** Plain text of a passage, for word counts and read-aloud. */
const plainTextOf = (passages: ExamPassagePublic[]) =>
  passages
    .map((p) => parseBlocks(withGapMarkers(p.content ?? '')).map(blockText).join('\n'))
    .join('\n')
    .replace(/\*\*/g, '')
    .trim();

/**
 * The text a question refers to. Shows how long it takes to read, can be read aloud (German voice),
 * lets the learner mark paragraphs with a highlighter by tapping them, and folds away to give the
 * options the whole screen. Open by default so the learner reads first.
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
  const [speaking, setSpeaking] = useState(false);
  const scale = useExamTextScale();
  const heading = title ?? (passages.length === 1 ? passages[0].label : 'Text');
  const text = plainTextOf(passages);
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 120));
  const readable = words > 0 && !passages.some((p) => p.audioUrl);

  // Never keep talking after the card is folded or the screen is left.
  const stopSpeech = useRef<(() => void) | null>(null);
  useEffect(() => () => stopSpeech.current?.(), []);
  const halt = () => {
    stopSpeech.current?.();
    stopSpeech.current = null;
    setSpeaking(false);
  };
  const toggleOpen = () => {
    if (open) halt();
    setOpen((v) => !v);
  };

  const toggleSpeech = () => {
    if (speaking) {
      halt();
      return;
    }
    setSpeaking(true);
    stopSpeech.current = speakGerman(text, { onDone: halt, onError: halt });
  };

  return (
    <View style={[styles.reading, { borderColor: tint(color, '33') }]}>
      <View style={[styles.readingHead, { backgroundColor: tint(color, '14') }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${heading} ${open ? 'ausblenden' : 'anzeigen'}`}
          accessibilityState={{ expanded: open }}
          onPress={toggleOpen}
          style={styles.readingTitle}
        >
          <View style={[styles.readingIcon, { backgroundColor: tint(color, '33') }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">{heading}</AppText>
            {words > 0 ? (
              <AppText variant="caption" color={colors.mutedForeground}>
                {words} Wörter · ca. {minutes} Min. Lesezeit
              </AppText>
            ) : null}
          </View>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.mutedForeground} />
        </Pressable>
        {readable && open ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={speaking ? 'Vorlesen stoppen' : 'Text vorlesen'}
            accessibilityState={{ selected: speaking }}
            onPress={toggleSpeech}
            style={[styles.speak, { backgroundColor: speaking ? color : tint(color, '33') }]}
          >
            <Ionicons name={speaking ? 'stop' : 'volume-high'} size={20} color={speaking ? '#FFFFFF' : color} />
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <View style={[styles.readingBody, { borderLeftColor: color }]}>
          {passages.map((p) => (
            <View key={p.id} style={{ gap: spacing.xs }}>
              {passages.length > 1 ? (
                <AppText variant="caption" color={color} style={{ fontWeight: '700' }}>
                  {p.label.toUpperCase()}
                </AppText>
              ) : null}
              <PassageBody passage={p} highlightable />
            </View>
          ))}
          {extra}
          {words > 0 ? (
            <View style={styles.tip}>
              <Ionicons name="color-wand-outline" size={16} color={colors.mutedForeground} />
              <AppText variant="caption" color={colors.mutedForeground} style={scaledText(12, 16, Math.min(scale, 1.15))}>
                Tippe auf einen Absatz, um ihn zu markieren.
              </AppText>
            </View>
          ) : null}
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
  const scale = useExamTextScale();
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
              <AppText style={[scaledText(BODY_SIZE, BODY_LINE, scale), gone && { textDecorationLine: 'line-through' }]}>
                {option}
              </AppText>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  readingTitle: {
    flex: 1,
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  readingIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  speak: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  readingBody: {
    margin: spacing.lg,
    marginTop: spacing.md,
    paddingLeft: spacing.md,
    borderLeftWidth: 4,
    gap: spacing.md,
  },
  tip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
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
