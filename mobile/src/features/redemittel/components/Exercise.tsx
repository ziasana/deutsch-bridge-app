import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button } from '@/components/ui';
import { PressableScale } from '@/features/exam/components/kit';
import { scaledText, useExamTextScale } from '@/features/exam/textScale';
import { colors, radius, spacing } from '@/theme';
import type { RedemittelAnswer, RedemittelExercise } from '@/types/redemittel';
import { EXERCISE_LABELS, REDEMITTEL_COLOR, inDays } from '../meta';
import { REDEMITTEL_DARK } from '../meta';

type Props = {
  exercise: RedemittelExercise;
  /** Submits the answer (option id or text) and resolves with the grading. */
  onAnswer: (answer: string) => Promise<RedemittelAnswer>;
  onNext: () => void;
  isLast: boolean;
  /** Review answers move the schedule, so the result also tells when the next review is. */
  showSchedule?: boolean;
};

/**
 * One reusable exercise for every Redemittel type (choice, word order, short text, own sentence).
 * Feedback is always text + icon, never colour alone, and stays encouraging.
 */
export function Exercise({ exercise, onAnswer, onNext, isLast, showSchedule }: Props) {
  const scale = useExamTextScale();
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [placed, setPlaced] = useState<number[]>([]);
  const [result, setResult] = useState<RedemittelAnswer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (answer: string) => {
    if (submitting || result) return;
    setSubmitting(true);
    setError(null);
    try {
      setResult(await onAnswer(answer));
    } catch {
      setError('Die Antwort konnte nicht gespeichert werden. Bitte versuche es noch einmal.');
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  };

  const isProduction = exercise.type === 'PRODUCTION';
  const isWordOrder = exercise.type === 'WORD_ORDER';
  const isChoice = !!exercise.options && !isWordOrder;
  const words = exercise.options ?? [];
  const good = result?.correct;

  return (
    <View style={styles.card}>
      <AppText variant="caption" color={REDEMITTEL_COLOR} style={{ fontWeight: '800' }}>
        {EXERCISE_LABELS[exercise.type].toUpperCase()}
      </AppText>
      <AppText style={[styles.prompt, scaledText(19, 28, scale)]}>{exercise.prompt}</AppText>

      {isProduction && exercise.phrase ? (
        <View style={styles.phrase}>
          <AppText style={{ fontWeight: '800', fontSize: 18 }}>„{exercise.phrase} …“</AppText>
        </View>
      ) : null}
      {isProduction && exercise.topic ? (
        <AppText variant="small" color={colors.mutedForeground}>
          <AppText variant="small" style={{ fontWeight: '800' }}>
            Thema:{' '}
          </AppText>
          {exercise.topic}
        </AppText>
      ) : null}

      {isWordOrder ? (
        <View style={{ gap: spacing.md }}>
          <View accessibilityLabel="Dein Satz" style={styles.tray}>
            {placed.length === 0 ? (
              <AppText variant="small" color={colors.mutedForeground}>
                Tippe die Wörter in der richtigen Reihenfolge an …
              </AppText>
            ) : null}
            {placed.map((wordIndex, position) => (
              <Pressable
                key={`${wordIndex}-${position}`}
                accessibilityRole="button"
                accessibilityLabel={`${words[wordIndex].text} entfernen`}
                disabled={result !== null}
                onPress={() => setPlaced(placed.filter((_, i) => i !== position))}
                style={[
                  styles.word,
                  { backgroundColor: `${REDEMITTEL_COLOR}22`, borderColor: REDEMITTEL_COLOR },
                ]}
              >
                <AppText style={{ fontWeight: '700' }}>{words[wordIndex].text}</AppText>
              </Pressable>
            ))}
          </View>
          <View style={styles.bank}>
            {words.map((word, wordIndex) =>
              placed.includes(wordIndex) ? null : (
                <Pressable
                  key={word.id}
                  accessibilityRole="button"
                  accessibilityLabel={word.text}
                  disabled={result !== null}
                  onPress={() => setPlaced([...placed, wordIndex])}
                  style={styles.word}
                >
                  <AppText style={{ fontWeight: '600' }}>{word.text}</AppText>
                </Pressable>
              ),
            )}
          </View>
          {result === null ? (
            <View style={{ gap: spacing.sm }}>
              <Button
                pill
                label="Prüfen"
                loading={submitting}
                disabled={placed.length !== words.length}
                onPress={() => void submit(placed.map((i) => words[i].text).join(' '))}
                color={REDEMITTEL_COLOR}
              />
              <Button
                pill
                variant="ghost"
                label="Zurücksetzen"
                disabled={placed.length === 0}
                onPress={() => setPlaced([])}
                color={REDEMITTEL_DARK}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {isChoice ? (
        <View style={{ gap: spacing.sm }} accessibilityLabel="Antwortmöglichkeiten">
          {words.map((option, i) => {
            const chosen = selected === option.id;
            const right = result !== null && option.text === result.correctAnswer;
            return (
              <PressableScale
                key={option.id}
                accessibilityRole="radio"
                accessibilityLabel={option.text}
                accessibilityState={{ selected: chosen, disabled: result !== null || submitting }}
                disabled={result !== null || submitting}
                onPress={() => {
                  setSelected(option.id);
                  void submit(option.id);
                }}
                style={[
                  styles.option,
                  right && { borderColor: colors.success, backgroundColor: colors.successSoft },
                  result !== null &&
                    !right &&
                    chosen && { borderColor: colors.warning, backgroundColor: colors.warningSoft },
                  result !== null && !right && !chosen && { opacity: 0.55 },
                ]}
              >
                <View style={styles.letter}>
                  <AppText variant="small" style={{ fontWeight: '800' }} color={colors.primaryDark}>
                    {String.fromCharCode(65 + i)}
                  </AppText>
                </View>
                <AppText style={[{ flex: 1 }, scaledText(16, 24, scale)]}>{option.text}</AppText>
                {right ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                ) : null}
                {result !== null && !right && chosen ? (
                  <Ionicons name="help-circle" size={22} color={colors.warning} />
                ) : null}
              </PressableScale>
            );
          })}
        </View>
      ) : null}

      {!exercise.options ? (
        <View style={{ gap: spacing.md }}>
          <TextInput
            accessibilityLabel={
              isProduction
                ? 'Dein Satz'
                : exercise.type === 'CLOZE'
                  ? 'Fehlendes Redemittel'
                  : 'Fehlendes Wort'
            }
            value={text}
            onChangeText={setText}
            editable={result === null}
            multiline={isProduction}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={
              isProduction
                ? 'Schreibe deinen Satz …'
                : exercise.type === 'CLOZE'
                  ? 'Redemittel eintippen …'
                  : 'Fehlendes Wort …'
            }
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, isProduction && { minHeight: 100, textAlignVertical: 'top' }]}
          />
          {result === null ? (
            <Button
              pill
              label={isProduction ? 'Abschicken' : 'Prüfen'}
              loading={submitting}
              disabled={!text.trim()}
              onPress={() => void submit(text.trim())}
              color={REDEMITTEL_COLOR}
            />
          ) : null}
        </View>
      ) : null}

      {error ? (
        <AppText variant="small" color={colors.destructive} accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}

      {result ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.feedback,
            { backgroundColor: result.attempted || good ? colors.successSoft : colors.warningSoft },
          ]}
        >
          {result.attempted ? (
            <>
              <AppText style={{ fontWeight: '800' }}>
                ✓ Gut gemacht – du hast das Redemittel selbst verwendet.
              </AppText>
              {result.modelAnswer ? (
                <AppText variant="small">
                  <AppText variant="small" style={{ fontWeight: '800' }}>
                    So kann es klingen:{' '}
                  </AppText>
                  „{result.modelAnswer}“
                </AppText>
              ) : null}
            </>
          ) : good ? (
            <AppText style={{ fontWeight: '800' }}>✓ Richtig!</AppText>
          ) : (
            <>
              <AppText style={{ fontWeight: '800' }}>✗ Noch einmal üben</AppText>
              {result.correctAnswer ? (
                <AppText variant="small">
                  <AppText variant="small" style={{ fontWeight: '800' }}>
                    Richtig wäre:{' '}
                  </AppText>
                  {result.correctAnswer}
                </AppText>
              ) : null}
            </>
          )}
          {showSchedule && result.status === 'MASTERED' ? (
            <AppText variant="small">Sicher gelernt – keine weitere Wiederholung nötig.</AppText>
          ) : null}
          {showSchedule && result.status !== 'MASTERED' && result.nextReviewInDays !== null ? (
            <AppText variant="small">
              {good || result.attempted
                ? `Nächste Wiederholung: ${inDays(result.nextReviewInDays)}`
                : 'Dieses Redemittel wird morgen erneut wiederholt.'}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {result ? (
        <Button
          pill
          label={isLast ? 'Fertig' : 'Weiter'}
          onPress={onNext}
          color={REDEMITTEL_COLOR}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  prompt: { fontSize: 19, lineHeight: 28, fontWeight: '700', color: colors.ink },
  phrase: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accent },
  tray: {
    minHeight: 60,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  word: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  letter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 17,
    color: colors.foreground,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  feedback: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg },
});
