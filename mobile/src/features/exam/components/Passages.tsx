import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import { AppText, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { ExamPassagePublic } from '@/types/exam';
import { resolveUploadUrl } from '@/utils/urls';
import { optionLabelFor, withGapMarkers } from '../content';
import { AudioClip } from './AudioClip';

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

/** Reading texts / ads / cloze text. Single-text tasks share one card; matching tasks get one card per text. */
export function PassagesView({
  passages,
  taskType,
}: {
  passages: ExamPassagePublic[];
  taskType: string | null;
}) {
  if (passages.length === 0) return null;
  if (taskType === 'MULTIPLE_CHOICE' || taskType === 'WORD_BANK_CLOZE') {
    return (
      <Card style={{ gap: spacing.md }}>
        {passages.map((p) => (
          <PassageBody key={p.id} passage={p} />
        ))}
      </Card>
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      {passages.map((p) => (
        <Card key={p.id} style={{ gap: spacing.sm }}>
          <AppText variant="subheading">{p.label}</AppText>
          <PassageBody passage={p} />
        </Card>
      ))}
    </View>
  );
}

/** Shared pool of headlines (Zuordnung) or words (Lückentext) the answers are chosen from. */
export function AnswerPool({
  answerOptions,
  labels,
  taskType,
}: {
  answerOptions: string[];
  labels: string[] | null;
  taskType: string | null;
}) {
  if (answerOptions.length === 0) return null;
  return (
    <Card style={{ gap: spacing.sm }}>
      <AppText color={colors.mutedForeground}>
        {taskType === 'WORD_BANK_CLOZE'
          ? 'Wörter — nicht jedes passt in eine Lücke:'
          : 'Überschriften — nicht jede passt zu einem Text:'}
      </AppText>
      <View style={taskType === 'WORD_BANK_CLOZE' ? styles.wordGrid : { gap: spacing.xs }}>
        {answerOptions.map((option, i) => (
          <AppText key={`${i}-${option}`} style={taskType === 'WORD_BANK_CLOZE' ? styles.word : null}>
            <AppText style={{ fontWeight: '700' }}>{optionLabelFor(labels, i)})</AppText> {option}
          </AppText>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.muted },
  wordGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.lg, rowGap: spacing.xs },
  word: { minWidth: '40%' },
});
