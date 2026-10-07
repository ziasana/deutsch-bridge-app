import { Platform, StyleSheet, Text } from 'react-native';
import { useI18n } from '@/i18n';
import { ltrText } from '@/i18n/direction';
import { colors } from '@/theme';
import type { Annotation } from '@/types/reading';
import type { Segment } from '../segments';

type Props = {
  segments: Segment[];
  fontSize: number;
  activeAnnotationId: string | null;
  tappedLemmas: string[];
  /** Annotation types whose highlight is switched off (still tappable). */
  hiddenTypes?: ReadonlySet<Annotation['type']>;
  onAnnotation: (annotation: Annotation) => void;
  onWord: (lemma: string) => void;
};

const HIGHLIGHT: Record<Annotation['type'], object> = {
  WORD: { backgroundColor: colors.warningSoft, textDecorationLine: 'underline' },
  NOMEN_VERB_VERBINDUNG: { backgroundColor: colors.accent, textDecorationLine: 'underline' },
  REDEWENDUNG: { backgroundColor: '#FFE9DB', textDecorationLine: 'underline' },
};

// Different underline styles back up the colours on iOS (Android renders solid only).
const DECORATION: Record<Annotation['type'], 'dotted' | 'solid' | 'dashed'> = {
  WORD: 'dotted',
  NOMEN_VERB_VERBINDUNG: 'solid',
  REDEWENDUNG: 'dashed',
};

/** The article body: one selectable text flow where annotated phrases and every word are tappable. */
export function ArticleText({
  segments,
  fontSize,
  activeAnnotationId,
  tappedLemmas,
  hiddenTypes,
  onAnnotation,
  onWord,
}: Props) {
  const { t } = useI18n();
  const showsMeaning = t.reading.annotation.showsMeaning;
  const lineHeight = Math.round(fontSize * 1.65);
  return (
    <Text style={[styles.body, { fontSize, lineHeight }]} selectable={false}>
      {segments.map((seg, i) => {
        if (seg.kind === 'plain') return seg.text;
        if (seg.kind === 'word') {
          return (
            <Text key={i} onPress={() => onWord(seg.lemma)} accessibilityRole="button">
              {seg.text}
            </Text>
          );
        }
        const a = seg.annotation;
        const active = a.id === activeAnnotationId;
        const seen = tappedLemmas.includes(a.lemma);
        const hidden = hiddenTypes?.has(a.type) && !active;
        return (
          <Text
            key={i}
            onPress={() => onAnnotation(a)}
            accessibilityRole="button"
            accessibilityHint={showsMeaning}
            style={
              hidden
                ? undefined
                : [
                    HIGHLIGHT[a.type],
                    Platform.OS === 'ios' && { textDecorationStyle: DECORATION[a.type] },
                    seen && styles.seen,
                    active && styles.active,
                  ]
            }
          >
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  // German reading text stays left-to-right even in the Persian (RTL) interface.
  body: { color: colors.foreground, ...ltrText },
  seen: { backgroundColor: colors.muted },
  active: { backgroundColor: '#C9DEFF' },
});
