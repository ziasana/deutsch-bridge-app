import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import {
  WordTapContext,
  nextSelection,
  type WordSelection,
  type WordTapConfig,
} from '@/components/content/WordTap';
import { AppText, ErrorNotice } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';
import type { ChatMessage } from '@/types/chat';
import { useSaveFromChat } from '../hooks';

type Props = { message: ChatMessage; sessionId?: string };

/**
 * A tutor answer whose words can be tapped: the tapped word (or a run of neighbouring words) is
 * highlighted and a "Save" pill appears under the answer; one tap on it adds it to the vocabulary.
 */
function TutorBubble({ message, sessionId }: { message: ChatMessage; sessionId: string }) {
  const { t } = useI18n();
  const w = t.tutor;
  const [selection, setSelection] = useState<WordSelection | null>(null);
  const save = useSaveFromChat(sessionId || null, message.id);
  const outcome = save.data;

  const config = useMemo<WordTapConfig>(
    () => ({
      selection,
      onTap: (scope, index, words) => {
        if (save.isPending) return;
        save.reset();
        setSelection((current) => nextSelection(current, scope, index, words));
      },
    }),
    [selection, save],
  );

  const isPhrase = !!selection && selection.from !== selection.to;
  const label = selection
    ? isPhrase
      ? w.saveExpressionQuoted(selection.text)
      : w.saveWordQuoted(selection.text)
    : '';

  return (
    <View style={{ flex: 1, gap: spacing.xs, alignItems: 'flex-start' }}>
      <View style={[styles.bubble, styles.tutor]} accessibilityLabel={w.answerLabel}>
        <WordTapContext.Provider value={config}>
          <RichContent content={message.content} />
        </WordTapContext.Provider>
      </View>

      {selection ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          disabled={save.isPending}
          onPress={() =>
            save.mutate(
              { text: selection.text, context: message.content },
              { onSuccess: () => setSelection(null) },
            )
          }
          style={({ pressed }) => [styles.save, pressed && { opacity: 0.8 }]}
        >
          {save.isPending ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Ionicons name="bookmark" size={16} color={colors.primaryForeground} />
          )}
          <AppText
            variant="small"
            color={colors.primaryForeground}
            numberOfLines={1}
            style={{ fontWeight: '700', flexShrink: 1 }}
          >
            {save.isPending ? w.saving : isPhrase ? w.saveExpression : w.saveWord}
            {!save.isPending ? `: ${selection.text}` : ''}
          </AppText>
        </Pressable>
      ) : null}

      {save.error ? <ErrorNotice error={save.error} /> : null}
      {outcome?.kind === 'saved' ? (
        <AppText variant="small" color="#1B7A55" accessibilityRole="alert">
          {w.added(outcome.word, outcome.meaning)}
        </AppText>
      ) : null}
      {outcome?.kind === 'exists' ? (
        <AppText variant="small" accessibilityRole="alert">
          {w.exists(outcome.word)}
        </AppText>
      ) : null}
      {!selection && !outcome && !save.error ? (
        <AppText variant="caption" color={colors.mutedForeground}>
          {w.tapHint}
        </AppText>
      ) : null}
    </View>
  );
}

export function MessageBubble({ message, sessionId }: Props) {
  const { t } = useI18n();
  if (message.role === 'user') {
    return (
      <View style={[styles.row, { justifyContent: 'flex-end' }]}>
        <View style={[styles.bubble, styles.user]}>
          <AppText color={colors.primaryForeground} selectable>
            {message.content}
          </AppText>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <View style={styles.avatar} accessibilityElementsHidden>
        <Ionicons name="sparkles" size={16} color="#FFFFFF" />
      </View>
      <TutorBubble message={message} sessionId={sessionId ?? ''} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { borderRadius: 22, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  user: { maxWidth: '85%', backgroundColor: colors.brand, borderBottomEndRadius: 6 },
  tutor: { backgroundColor: '#F1F5FB', borderTopStartRadius: 6 },
  save: {
    minHeight: 40,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
});
