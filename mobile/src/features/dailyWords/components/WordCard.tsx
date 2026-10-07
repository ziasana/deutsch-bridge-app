import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, DirectionalIcon } from '@/components/ui';
import { PressableScale, tint } from '@/features/exam/components/kit';
import { rtlText } from '@/i18n/direction';
import { useI18n } from '@/i18n';
import { colors, radius, shadow, spacing } from '@/theme';
import type { DailyWord } from '@/types/dailyWord';
import { splitSynonyms } from '../flow';
import { DAILY_COLOR, WordStepper } from './DailyViz';

type Props = {
  word: DailyWord;
  words: DailyWord[];
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
  onJump: (index: number) => void;
  onSave: () => void;
  onContinue: () => void;
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The example sentence with the word itself set in bold, so the eye finds it in context. */
function ExampleLine({ example, word }: { example: string; word: string }) {
  const parts = example.split(new RegExp(`(${escapeRegExp(word)})`, 'i'));
  return (
    <AppText style={styles.exampleText}>
      „
      {parts.map((part, i) =>
        part.toLowerCase() === word.toLowerCase() ? (
          <AppText key={i} style={styles.hit}>
            {part}
          </AppText>
        ) : (
          part
        ),
      )}
      “
    </AppText>
  );
}

export function WordCard({
  word,
  words,
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
  onJump,
  onSave,
  onContinue,
}: Props) {
  const { t } = useI18n();
  const d = t.daily;
  const synonyms = splitSynonyms(word.synonyms);

  // Never leave speech running when the word changes or the screen closes.
  useEffect(() => () => void Speech.stop(), [word.id]);

  const continueLabel = word.learned
    ? isLast
      ? d.done
      : d.next
    : isLast
      ? d.learnedDone
      : d.learnedNext;

  return (
    <View style={styles.gap}>
      <View accessible accessibilityLabel={d.progress(learnedCount, total)} style={styles.gap}>
        <View style={styles.rowBetween}>
          <AppText variant="subheading">
            {index + 1} / {total}
          </AppText>
          <AppText variant="small" color={colors.mutedForeground}>
            {d.learnedCount(learnedCount)}
          </AppText>
        </View>
      </View>
      <WordStepper words={words} current={index} onJump={onJump} />

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.level}>
            <AppText variant="caption" color="#8A5A00" style={{ fontWeight: '800' }}>
              {word.level}
            </AppText>
          </View>
          {word.learned ? (
            <View style={styles.learned}>
              <Ionicons name="checkmark-circle" size={14} color="#1B7A55" />
              <AppText variant="caption" color="#1B7A55" style={{ fontWeight: '800' }}>
                {d.learnedBadge}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.wordRow}>
          <AppText style={styles.word} accessibilityRole="header">
            {word.word}
          </AppText>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={d.listen(word.word)}
            onPress={() => {
              void Speech.stop();
              Speech.speak(word.word, { language: 'de-DE' });
            }}
            style={styles.speak}
          >
            <Ionicons name="volume-high" size={26} color="#FFFFFF" />
          </PressableScale>
        </View>

        <View style={styles.meaning}>
          <AppText variant="caption" color="#8A5A00" style={{ fontWeight: '800' }}>
            {d.meaning}
          </AppText>
          <AppText style={styles.meaningText}>{word.meaning}</AppText>
        </View>

        {word.example ? (
          <View style={styles.example}>
            <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '800' }}>
              {d.example}
            </AppText>
            <ExampleLine example={word.example} word={word.word} />
          </View>
        ) : null}

        {synonyms.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '800' }}>
              {d.similar}
            </AppText>
            <View
              style={styles.chips}
              accessible
              accessibilityLabel={d.similarLabel(synonyms.join(', '))}
            >
              {synonyms.map((s) => (
                <View key={s} style={styles.chip}>
                  <AppText variant="small" color={colors.primaryDark} style={{ fontWeight: '600' }}>
                    {s}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
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
      </View>

      {error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}

      <Button pill label={continueLabel} loading={isMarking} onPress={onContinue} />
      <Button
        pill
        label={isSaved ? d.savedToVocabulary : d.addToVocabulary}
        variant="secondary"
        loading={isSaving}
        disabled={isSaved}
        onPress={onSave}
      />
      {canGoPrevious ? (
        <Button pill label={d.previousWord} variant="ghost" onPress={onPrevious} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  level: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: tint(DAILY_COLOR, '33'),
  },
  learned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  word: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    flexShrink: 1,
  },
  speak: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: DAILY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meaning: {
    gap: 2,
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: tint(DAILY_COLOR, '14'),
  },
  meaningText: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: colors.foreground },
  example: {
    gap: 4,
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderTopStartRadius: 6,
    backgroundColor: colors.accent,
  },
  exampleText: { fontStyle: 'italic', color: colors.ink },
  hit: { fontWeight: '800', fontStyle: 'normal', color: colors.primaryDark },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  fa: { gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  rtl: rtlText,
});
