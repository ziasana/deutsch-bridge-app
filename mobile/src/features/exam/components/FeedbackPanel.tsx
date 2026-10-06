import { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { BODY_LINE, BODY_SIZE, scaledText, useExamTextScale } from '../textScale';
import type { ExamAnswerFeedback } from '@/types/exam';

/**
 * Immediate feedback after an answer, pinned above the "next" button. It slides up so the change of
 * state is noticed, and leads with the verdict, then the right answer, then the why.
 */
export function FeedbackPanel({
  feedback,
  formatAnswer,
}: {
  feedback: ExamAnswerFeedback;
  formatAnswer?: (value: string) => string;
}) {
  const [enter] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(enter, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }).start();
  }, [enter]);
  const scale = useExamTextScale();
  const body = scaledText(BODY_SIZE, BODY_LINE, scale);
  const ok = feedback.correct;
  const tone = ok ? '#1B7A55' : colors.destructive;
  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
      }}
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.xs }}>
          <AppText style={styles.verdict} color={tone} accessibilityRole="alert">
            {ok ? '✓ Richtig' : '✕ Falsch'}
          </AppText>
          {!ok ? (
            <AppText style={body}>
              Richtige Antwort:{' '}
              <AppText style={{ fontWeight: '700' }}>
                {formatAnswer ? formatAnswer(feedback.correctAnswer) : feedback.correctAnswer}
              </AppText>
            </AppText>
          ) : null}
          {feedback.explanation ? <AppText style={body}>💡 {feedback.explanation}</AppText> : null}
          {feedback.commonMistake ? (
            <AppText style={[body, { fontStyle: 'italic' }]}>⚠️ Häufiger Fehler: {feedback.commonMistake}</AppText>
          ) : null}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 150 },
  verdict: { fontSize: 20, lineHeight: 26, fontWeight: '800' },
});
