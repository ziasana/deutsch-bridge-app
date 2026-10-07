import { tint } from '@/features/exam/components/kit';
import * as Speech from 'expo-speech';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Badge, Card } from '@/components/ui';
import { useI18n } from '@/i18n';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { PracticeVocabularyItem } from '@/types/vocabulary';
import { splitSynonyms } from '@/features/dailyWords/flow';
import { VOCABULARY_COLOR, VOCABULARY_DARK } from '../meta';

type Props = { item: PracticeVocabularyItem; flipped: boolean; onFlip: () => void };

// Same colours as the web article chips, always paired with the article text.
const ARTICLE_TONE: Record<string, 'primary' | 'warning' | 'success'> = {
  der: 'primary',
  die: 'warning',
  das: 'success',
};

export function Flashcard({ item, flipped, onFlip }: Props) {
  const { t } = useI18n();
  const tr = t.vocabulary.trainer;
  const label = item.article ? `${item.article} ${item.word}` : item.word;
  const synonyms = splitSynonyms(item.synonyms);

  useEffect(() => () => void Speech.stop(), [item.vocabularyItemId]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={flipped ? tr.flipBack(label, item.meaning) : tr.flip(label)}
      onPress={onFlip}
    >
      <Card tone={flipped ? 'accent' : 'default'} style={styles.card}>
        {!flipped ? (
          <>
            {item.article ? (
              <Badge
                tone={ARTICLE_TONE[item.article.toLowerCase()] ?? 'primary'}
                label={item.article}
              />
            ) : null}
            <View style={styles.wordRow}>
              <AppText style={styles.word}>{item.word}</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.vocabulary.listenItem(label)}
                onPress={() => {
                  void Speech.stop();
                  Speech.speak(label, { language: 'de-DE' });
                }}
                style={styles.speak}
              >
                <AppText style={{ fontSize: 22 }}>🔊</AppText>
              </Pressable>
            </View>
            <AppText variant="small" color={colors.mutedForeground}>
              {tr.tapToFlip}
            </AppText>
          </>
        ) : (
          <>
            <AppText variant="caption" color={VOCABULARY_DARK}>
              {label.toUpperCase()}
            </AppText>
            <AppText variant="title" center>
              {item.meaning}
            </AppText>
            {item.example ? (
              <AppText color={colors.mutedForeground} center style={{ fontStyle: 'italic' }}>
                “{item.example}”
              </AppText>
            ) : null}
            {synonyms.length > 0 ? (
              <AppText variant="small" color={colors.mutedForeground} center>
                {tr.similar(synonyms.join(' · '))}
              </AppText>
            ) : null}
          </>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  word: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
    flexShrink: 1,
  },
  speak: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.pill,
    backgroundColor: tint(VOCABULARY_COLOR, '1F'),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
