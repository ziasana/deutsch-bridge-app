import * as Speech from 'expo-speech';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, ProgressBar } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { DailyWord } from '@/types/dailyWord';
import { splitSynonyms } from '../flow';

type Props = {
  word: DailyWord;
  index: number;
  total: number;
  learnedCount: number;
  isLast: boolean;
  isSaved: boolean;
  isSaving: boolean;
  isMarking: boolean;
  error?: string;
  canGoPrevious: boolean;
  onPrevious: () => void;
  onSave: () => void;
  onContinue: () => void;
};

export function WordCard({
  word,
  index,
  total,
  learnedCount,
  isLast,
  isSaved,
  isSaving,
  isMarking,
  error,
  canGoPrevious,
  onPrevious,
  onSave,
  onContinue,
}: Props) {
  const synonyms = splitSynonyms(word.synonyms);

  // Never leave speech running when the word changes or the screen closes.
  useEffect(() => () => void Speech.stop(), [word.id]);

  const continueLabel = word.learned
    ? isLast
      ? 'Fertig'
      : 'Weiter'
    : isLast
      ? 'Gelernt · Fertig'
      : 'Gelernt · Weiter';

  return (
    <View style={styles.gap}>
      <View accessible accessibilityLabel={`${learnedCount} von ${total} Wörtern gelernt`} style={styles.gap}>
        <View style={styles.rowBetween}>
          <AppText variant="subheading">
            {index + 1} / {total}
          </AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            {learnedCount} gelernt
          </AppText>
        </View>
        <ProgressBar value={learnedCount} max={total} label="Gelernte Wörter" />
      </View>

      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Badge tone="primary" label={word.level} />
          {word.learned ? <Badge tone="success" label="✓ Gelernt" /> : null}
        </View>

        <View style={styles.wordRow}>
          <AppText style={styles.word} accessibilityRole="header">
            {word.word}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Aussprache von ${word.word} anhören`}
            onPress={() => {
              void Speech.stop();
              Speech.speak(word.word, { language: 'de-DE' });
            }}
            style={styles.speak}
          >
            <AppText style={styles.speakIcon}>🔊</AppText>
          </Pressable>
        </View>

        <AppText variant="heading" center>
          {word.meaning}
        </AppText>

        {word.example ? (
          <View style={styles.example}>
            <AppText variant="small" color={colors.mutedForeground} style={{ fontWeight: '600' }}>
              Beispiel
            </AppText>
            <AppText style={styles.italic}>„{word.example}“</AppText>
          </View>
        ) : null}

        {synonyms.length > 0 ? (
          <AppText variant="small" color={colors.mutedForeground} center>
            Ähnlich: {synonyms.join(' · ')}
          </AppText>
        ) : null}

        {word.meaningFa || word.exampleFa ? (
          <View style={styles.fa}>
            {word.meaningFa ? <AppText style={styles.rtl}>{word.meaningFa}</AppText> : null}
            {word.exampleFa ? (
              <AppText variant="small" color={colors.mutedForeground} style={styles.rtl}>
                {word.exampleFa}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </Card>

      {error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}

      <Button label={continueLabel} loading={isMarking} onPress={onContinue} />
      <Button
        label={isSaved ? '✓ In Vocabulary gespeichert' : 'Zu Vocabulary hinzufügen'}
        variant="secondary"
        loading={isSaving}
        disabled={isSaved}
        onPress={onSave}
      />
      {canGoPrevious ? <Button label="‹ Vorheriges Wort" variant="ghost" onPress={onPrevious} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { gap: spacing.md, padding: spacing.xl },
  wordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, flexWrap: 'wrap' },
  word: { fontSize: 34, lineHeight: 42, fontWeight: '700', color: colors.foreground, textAlign: 'center', flexShrink: 1 },
  speak: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakIcon: { fontSize: 22 },
  example: { gap: 2, borderLeftWidth: 4, borderLeftColor: colors.accent, paddingLeft: spacing.md },
  italic: { fontStyle: 'italic', color: colors.mutedForeground },
  fa: { gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
