import { useState } from 'react';
import { View } from 'react-native';
import { AppText, BottomSheet, Button, TextField, ErrorNotice } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, spacing } from '@/theme';
import type { ChatMessage } from '@/types/chat';
import { useSaveFromChat } from '../hooks';

type Props = { message: ChatMessage | null; sessionId: string; onClose: () => void };

function Form({
  message,
  sessionId,
  onClose,
}: {
  message: ChatMessage;
  sessionId: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const w = t.tutor;
  const [text, setText] = useState('');
  const save = useSaveFromChat(sessionId || null, message.id);
  const outcome = save.data;

  return (
    <View style={{ gap: spacing.md }}>
      <AppText color={colors.mutedForeground}>{w.saveHelp}</AppText>
      <TextField
        label={w.wordOrPhrase}
        value={text}
        onChangeText={(v) => {
          setText(v);
          if (save.data || save.error) save.reset();
        }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />
      {save.error ? <ErrorNotice error={save.error} /> : null}
      {outcome?.kind === 'saved' ? (
        <AppText color="#1B7A55" accessibilityRole="alert">
          {w.added(outcome.word, outcome.meaning)}
        </AppText>
      ) : null}
      {outcome?.kind === 'exists' ? (
        <AppText accessibilityRole="alert">{w.exists(outcome.word)}</AppText>
      ) : null}
      {outcome ? (
        <Button label={w.done} onPress={onClose} />
      ) : (
        <Button
          label={w.addToVocabulary}
          loading={save.isPending}
          disabled={!text.trim()}
          onPress={() => save.mutate({ text, context: message.content })}
        />
      )}
    </View>
  );
}

/** Saves a word or phrase from a tutor answer to the learner's vocabulary. */
export function SaveWordSheet({ message, sessionId, onClose }: Props) {
  const { t } = useI18n();
  return (
    <BottomSheet visible={!!message} onClose={onClose} title={t.tutor.saveWord}>
      {/* Keyed by message so every message starts with a fresh form and result. */}
      {message ? (
        <Form key={message.id} message={message} sessionId={sessionId} onClose={onClose} />
      ) : null}
    </BottomSheet>
  );
}
