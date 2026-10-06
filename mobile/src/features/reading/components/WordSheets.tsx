import * as Speech from 'expo-speech';
import { View } from 'react-native';
import { AppText, Badge, BottomSheet, Button, LoadingState } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { Annotation } from '@/types/reading';
import { useDictionaryEntry, useToggleDictionarySave } from '../hooks';
import { ANNOTATION_LABEL } from '../segments';

const ARTICLE_TONE = { der: 'primary', die: 'warning', das: 'success' } as const;

type AnnotationSheetProps = {
  annotation: Annotation | null;
  saved: boolean;
  saving: boolean;
  error?: string;
  onSave: () => void;
  onClose: () => void;
};

/** Details of a highlighted word, noun-verb phrase or idiom, with "save to review". */
export function AnnotationSheet({
  annotation: a,
  saved,
  saving,
  error,
  onSave,
  onClose,
}: AnnotationSheetProps) {
  return (
    <BottomSheet visible={!!a} onClose={onClose} title={a?.lemma}>
      {a ? (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Badge tone="primary" label={ANNOTATION_LABEL[a.type]} />
            {a.gender ? (
              <Badge
                tone={ARTICLE_TONE[a.gender as keyof typeof ARTICLE_TONE] ?? 'neutral'}
                label={a.gender}
              />
            ) : null}
            {a.cefrLevel ? <Badge label={a.cefrLevel} /> : null}
          </View>
          {a.pluralForm ? (
            <AppText color={colors.mutedForeground}>Plural: {a.pluralForm}</AppText>
          ) : null}
          {a.type === 'REDEWENDUNG' && a.literalTranslation ? (
            <AppText color={colors.mutedForeground}>
              Wörtlich: <AppText style={{ fontStyle: 'italic' }}>{a.literalTranslation}</AppText>
            </AppText>
          ) : null}
          {a.translationEn ? (
            <AppText variant="subheading">
              {a.type === 'REDEWENDUNG' ? 'Bedeutung: ' : ''}
              {a.translationEn}
            </AppText>
          ) : null}
          {a.exampleSentence ? (
            <AppText style={{ fontStyle: 'italic' }}>„{a.exampleSentence}“</AppText>
          ) : null}
          {error ? (
            <AppText color={colors.destructive} accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}
          <Button
            label={saved ? '✓ In deiner Wiederholung' : 'Zur Wiederholung speichern'}
            variant={saved ? 'secondary' : 'primary'}
            loading={saving}
            disabled={saved}
            onPress={onSave}
          />
        </>
      ) : null}
    </BottomSheet>
  );
}

/** Dictionary lookup for any tapped word (unknown words get a friendly "not found"). */
export function DictionarySheet({ lemma, onClose }: { lemma: string | null; onClose: () => void }) {
  const entry = useDictionaryEntry(lemma);
  const save = useToggleDictionarySave();
  const data = entry.data;
  return (
    <BottomSheet
      visible={!!lemma}
      onClose={() => {
        save.reset();
        onClose();
      }}
      title={data ? `${data.article ? `${data.article} ` : ''}${data.lemma}` : (lemma ?? '')}
    >
      {entry.isPending && lemma ? <LoadingState label="Wörterbuch …" /> : null}
      {entry.isError ? (
        <AppText color={colors.mutedForeground}>
          Zu diesem Wort gibt es noch keinen Wörterbucheintrag.
        </AppText>
      ) : null}
      {data ? (
        <>
          {data.ipa ? <AppText color={colors.mutedForeground}>/{data.ipa}/</AppText> : null}
          {data.senses.slice(0, 3).map((s) => (
            <View key={s.id} style={{ gap: 2 }}>
              <AppText variant="small" color={colors.primaryDark}>
                {s.pos}
              </AppText>
              <AppText variant="subheading">{s.translations.join(', ')}</AppText>
              {s.examples[0] ? (
                <AppText
                  variant="small"
                  color={colors.mutedForeground}
                  style={{ fontStyle: 'italic' }}
                >
                  „{s.examples[0].de}“ – {s.examples[0].en}
                </AppText>
              ) : null}
            </View>
          ))}
          {save.error ? (
            <AppText color={colors.destructive} accessibilityRole="alert">
              {save.error.message}
            </AppText>
          ) : null}
          <Button
            label={
              data.savedByCurrentUser
                ? '✓ Im Wortschatz – entfernen'
                : '＋ Zum Wortschatz hinzufügen'
            }
            variant={data.savedByCurrentUser ? 'secondary' : 'primary'}
            loading={save.isPending}
            onPress={() => save.mutate({ entry: data, lookupKey: lemma! })}
            accessibilityHint="Speichert das Wort in deinem Wortschatz"
          />
          <Button
            label="🔊 Anhören"
            variant="secondary"
            onPress={() => {
              void Speech.stop();
              Speech.speak(data.lemma, { language: 'de-DE' });
            }}
          />
        </>
      ) : null}
    </BottomSheet>
  );
}
