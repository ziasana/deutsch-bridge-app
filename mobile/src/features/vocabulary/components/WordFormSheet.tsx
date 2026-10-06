import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheet, Button, Chip, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { VocabularyItem } from '@/types/vocabulary';
import { useGenerateExample, useSaveVocabulary } from '../listHooks';

const ARTICLES = ['', 'der', 'die', 'das'] as const;

type Props = {
  visible: boolean;
  /** Present: edit this word. Absent: add a new one. */
  item?: VocabularyItem | null;
  onClose: () => void;
  onSaved?: (item: VocabularyItem) => void;
};

/** Add or edit a word: word, article, meaning and an example (optionally written by the AI). */
export function WordFormSheet({ visible, item, onClose, onSaved }: Props) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      tall
      title={item ? 'Wort bearbeiten' : 'Neues Wort'}
    >
      {/* The sheet's content only exists while it is open, so the form starts fresh every time. */}
      <WordForm item={item} onClose={onClose} onSaved={onSaved} />
    </BottomSheet>
  );
}

function WordForm({ item, onClose, onSaved }: Omit<Props, 'visible'>) {
  const [word, setWord] = useState(item?.word ?? '');
  const [article, setArticle] = useState(item?.article ?? '');
  const [meaning, setMeaning] = useState(item?.meaning ?? '');
  const [example, setExample] = useState(item?.example ?? '');
  const save = useSaveVocabulary(item?.id);
  const generate = useGenerateExample();

  const valid = word.trim() !== '' && meaning.trim() !== '';
  const submit = () => {
    if (!valid) return;
    save.mutate(
      {
        word: word.trim(),
        article: article || null,
        meaning: meaning.trim(),
        language: item?.language ?? null,
        example: example.trim() || null,
        level: item?.level ?? null,
      },
      {
        onSuccess: (saved) => {
          onSaved?.(saved);
          onClose();
        },
      },
    );
  };
  const suggest = () => generate.mutate(word.trim(), { onSuccess: (r) => setExample(r.word) });

  return (
    <>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="small" color={colors.mutedForeground}>
          Artikel
        </AppText>
        <View style={styles.row}>
          {ARTICLES.map((a) => (
            <Chip
              key={a || 'none'}
              label={a || 'Kein'}
              selected={article === a}
              onPress={() => setArticle(a)}
            />
          ))}
        </View>
      </View>
      <TextField
        label="Wort"
        value={word}
        onChangeText={setWord}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
      />
      <TextField label="Bedeutung" value={meaning} onChangeText={setMeaning} returnKeyType="next" />
      <View style={{ gap: spacing.xs }}>
        <TextField label="Beispielsatz" value={example} onChangeText={setExample} multiline />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Beispiel mit KI erzeugen"
          disabled={!word.trim() || generate.isPending}
          onPress={suggest}
          style={[styles.ai, (!word.trim() || generate.isPending) && { opacity: 0.4 }]}
        >
          <Ionicons name="sparkles" size={16} color={colors.primaryDark} />
          <AppText variant="small" color={colors.primaryDark} style={{ fontWeight: '700' }}>
            {generate.isPending ? 'Wird erzeugt …' : 'Beispiel mit KI erzeugen'}
          </AppText>
        </Pressable>
        {generate.error ? (
          <AppText variant="small" color={colors.destructive} accessibilityRole="alert">
            {generate.error.message}
          </AppText>
        ) : null}
      </View>
      {save.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {save.error.message}
        </AppText>
      ) : null}
      <Button pill label="Speichern" onPress={submit} loading={save.isPending} disabled={!valid} />
      <Button pill variant="ghost" label="Abbrechen" onPress={onClose} />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  ai: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    minHeight: 36,
  },
});
