import { useState } from 'react';
import { View } from 'react-native';
import { AppText, BottomSheet, Button, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { ChatMessage } from '@/types/chat';
import { useSaveFromChat } from '../hooks';

type Props = { message: ChatMessage | null; sessionId: string; onClose: () => void };

function Form({ message, sessionId, onClose }: { message: ChatMessage; sessionId: string; onClose: () => void }) {
  const [text, setText] = useState('');
  const save = useSaveFromChat(sessionId || null, message.id);
  const outcome = save.data;

  return (
    <View style={{ gap: spacing.md }}>
      <AppText color={colors.mutedForeground}>
        Tippe das Wort oder den Ausdruck aus der Antwort ein (du kannst ihn in der Antwort lange drücken, kopieren und hier einfügen). Der Tutor erkennt die Grundform und die Bedeutung.
      </AppText>
      <TextField
        label="Wort oder Ausdruck"
        value={text}
        onChangeText={(v) => {
          setText(v);
          if (save.data || save.error) save.reset();
        }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />
      {save.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {save.error.message}
        </AppText>
      ) : null}
      {outcome?.kind === 'saved' ? (
        <AppText color="#1B7A55" accessibilityRole="alert">
          ✓ Zum Vokabular hinzugefügt: {outcome.word} – {outcome.meaning}
        </AppText>
      ) : null}
      {outcome?.kind === 'exists' ? (
        <AppText accessibilityRole="alert">„{outcome.word}“ ist schon in deinem Vokabular.</AppText>
      ) : null}
      {outcome ? (
        <Button label="Fertig" onPress={onClose} />
      ) : (
        <Button
          label="Zum Vokabular hinzufügen"
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
  return (
    <BottomSheet visible={!!message} onClose={onClose} title="Wort speichern">
      {/* Keyed by message so every message starts with a fresh form and result. */}
      {message ? <Form key={message.id} message={message} sessionId={sessionId} onClose={onClose} /> : null}
    </BottomSheet>
  );
}
