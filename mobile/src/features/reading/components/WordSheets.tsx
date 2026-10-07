import * as Speech from 'expo-speech';
import { View } from 'react-native';
import {
  AppText,
  Badge,
  BottomSheet,
  Button,
  InlineError,
  LoadingState,
  ErrorNotice,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import { ltrText } from '@/i18n/direction';
import { colors, spacing } from '@/theme';
import type { Annotation } from '@/types/reading';
import { useDictionaryEntry, useToggleDictionarySave } from '../hooks';
import { annotationLabel } from '../segments';
import { READING_DARK } from './ReadingViz';

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
  const { t } = useI18n();
  const r = t.reading.annotation;
  return (
    <BottomSheet visible={!!a} onClose={onClose} title={a?.lemma}>
      {a ? (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Badge tone="primary" label={annotationLabel(r, a.type)} />
            {a.gender ? (
              <Badge
                tone={ARTICLE_TONE[a.gender as keyof typeof ARTICLE_TONE] ?? 'neutral'}
                label={a.gender}
              />
            ) : null}
            {a.cefrLevel ? <Badge label={a.cefrLevel} /> : null}
          </View>
          {a.pluralForm ? (
            <AppText color={colors.mutedForeground}>{r.plural(a.pluralForm)}</AppText>
          ) : null}
          {a.type === 'REDEWENDUNG' && a.literalTranslation ? (
            <AppText color={colors.mutedForeground}>
              {r.literal}
              <AppText style={[{ fontStyle: 'italic' }, ltrText]}>{a.literalTranslation}</AppText>
            </AppText>
          ) : null}
          {a.translationEn ? (
            <AppText variant="subheading">
              {a.type === 'REDEWENDUNG' ? r.meaning : ''}
              {a.translationEn}
            </AppText>
          ) : null}
          {a.exampleSentence ? (
            <AppText style={[{ fontStyle: 'italic' }, ltrText]}>„{a.exampleSentence}“</AppText>
          ) : null}
          {error ? <ErrorNotice message={error} /> : null}
          <Button
            label={saved ? r.savedReview : r.saveReview}
            variant={saved ? 'secondary' : 'primary'}
            loading={saving}
            disabled={saved}
            onPress={onSave}
            color={READING_DARK}
          />
        </>
      ) : null}
    </BottomSheet>
  );
}

/** Dictionary lookup for any tapped word (unknown words get a friendly "not found"). */
export function DictionarySheet({ lemma, onClose }: { lemma: string | null; onClose: () => void }) {
  const { t } = useI18n();
  const d = t.reading.dictionary;
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
      {entry.isPending && lemma ? <LoadingState label={d.loading} /> : null}
      {entry.isError ? <AppText color={colors.mutedForeground}>{d.notFound}</AppText> : null}
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
                  style={[{ fontStyle: 'italic' }, ltrText]}
                >
                  „{s.examples[0].de}“ – {s.examples[0].en}
                </AppText>
              ) : null}
            </View>
          ))}
          <InlineError error={save.error} />
          <Button
            label={data.savedByCurrentUser ? d.remove : d.add}
            variant={data.savedByCurrentUser ? 'secondary' : 'primary'}
            loading={save.isPending}
            onPress={() => save.mutate({ entry: data, lookupKey: lemma! })}
            accessibilityHint={d.addHint}
            color={READING_DARK}
          />
          <Button
            label={d.listen}
            variant="secondary"
            onPress={() => {
              void Speech.stop();
              Speech.speak(data.lemma, { language: 'de-DE' });
            }}
            color={READING_DARK}
          />
        </>
      ) : null}
    </BottomSheet>
  );
}
