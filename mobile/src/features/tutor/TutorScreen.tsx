import { AiUsageHint } from '@/features/aiUsage/AiUsageHint';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, BottomSheet, Button, ErrorState, LoadingState, TextField } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { ChatMessage } from '@/types/chat';
import { MessageBubble } from './components/MessageBubble';
import { SaveWordSheet } from './components/SaveWordSheet';
import { SessionsSheet } from './components/SessionsSheet';
import { STARTERS } from './groups';
import { useChatSessions, useTutorChat } from './hooks';

function EmptyChat({ onStarter }: { onStarter: (prompt: string) => void }) {
  return (
    <View style={styles.empty}>
      <AppText style={{ fontSize: 44 }} accessibilityElementsHidden>
        ✨
      </AppText>
      <AppText variant="title" center>
        Guten Tag! 👋
      </AppText>
      <AppText color={colors.mutedForeground} center>
        Ich bin dein Deutsch-Tutor. Übe Deutsch, stelle Fragen oder schreibe einfach mit mir.
      </AppText>
      <View style={{ width: '100%', gap: spacing.md, marginTop: spacing.md }}>
        {STARTERS.map((s) => (
          <Pressable
            key={s.key}
            accessibilityRole="button"
            accessibilityLabel={`${s.title}: ${s.description}`}
            onPress={() => onStarter(s.prompt)}
            style={({ pressed }) => [styles.starter, pressed && { backgroundColor: colors.accent }]}
          >
            <AppText style={{ fontSize: 24 }}>{s.emoji}</AppText>
            <View style={{ flex: 1 }}>
              <AppText variant="subheading">{s.title}</AppText>
              <AppText variant="small" color={colors.mutedForeground}>
                {s.description}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>
      <AppText variant="small" color={colors.mutedForeground} center>
        Oder schreibe einfach deine erste Nachricht …
      </AppText>
    </View>
  );
}

/** The AI Tutor tab: a chat with history, rename/delete, and "save word" from answers. */
export function TutorScreen() {
  const chat = useTutorChat();
  const sessions = useChatSessions();
  const [input, setInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState<ChatMessage | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const active = sessions.data?.find((s) => s.id === chat.sessionId) ?? null;
  const showEmpty = !chat.sessionId && chat.messages.length === 0 && !chat.thinking && !chat.error;

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [chat.messages.length, chat.thinking, chat.error]);

  const submit = () => {
    const text = input.trim();
    if (!text || chat.thinking) return;
    setInput('');
    void chat.send(text);
  };

  const confirmDeleteActive = () => {
    if (!active) return;
    Alert.alert(`„${active.title || 'Chat'}“ löschen?`, 'Der gesamte Chat wird gelöscht.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => chat.remove.mutate(active.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Unterhaltungen anzeigen"
          onPress={() => setHistoryOpen(true)}
          style={styles.headerButton}
        >
          <AppText color={colors.primaryDark}>☰</AppText>
        </Pressable>
        <AppText variant="subheading" numberOfLines={1} style={{ flex: 1 }} center accessibilityRole="header">
          {active?.title || 'AI Tutor'}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Neuer Chat"
          onPress={chat.newChat}
          style={styles.headerButton}
        >
          <AppText color={colors.primaryDark}>＋</AppText>
        </Pressable>
      </View>

      {active ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chat umbenennen"
            onPress={() => {
              setTitle(active.title ?? '');
              setRenameOpen(true);
            }}
          >
            <AppText variant="small" color={colors.primaryDark}>
              Umbenennen
            </AppText>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Chat löschen" onPress={confirmDeleteActive}>
            <AppText variant="small" color={colors.destructive}>
              Löschen
            </AppText>
          </Pressable>
        </View>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {chat.loadingSession ? (
          <LoadingState label="Chat wird geladen …" />
        ) : showEmpty ? (
          <EmptyChat onStarter={setInput} />
        ) : (
          <FlatList
            ref={listRef}
            data={chat.messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} onSaveWord={item.role === 'assistant' ? setSaving : undefined} />
            )}
            contentContainerStyle={styles.list}
            ListFooterComponent={
              <View style={{ gap: spacing.md }}>
                {chat.thinking ? (
                  <View style={styles.thinking} accessibilityLabel="Der Tutor denkt nach" accessibilityLiveRegion="polite">
                    <ActivityIndicator color={colors.primary} />
                    <AppText color={colors.mutedForeground}>Der Tutor denkt nach …</AppText>
                  </View>
                ) : null}
                {chat.error ? (
                  <ErrorState
                    error={chat.error.error}
                    onRetry={chat.error.question ? () => void chat.send(chat.error!.question, { resend: true }) : undefined}
                  />
                ) : null}
              </View>
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={{ paddingHorizontal: spacing.lg }}>
          <AiUsageHint feature="AI_CHAT" />
        </View>
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Nachricht"
            value={input}
            onChangeText={setInput}
            placeholder="Schreibe etwas auf Deutsch …"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Senden"
            accessibilityState={{ disabled: chat.thinking || !input.trim() }}
            disabled={chat.thinking || !input.trim()}
            onPress={submit}
            style={[styles.send, (chat.thinking || !input.trim()) && { opacity: 0.4 }]}
          >
            <AppText color={colors.primaryForeground} style={{ fontSize: 18, fontWeight: '700' }}>
              ↑
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <SessionsSheet
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessions.data}
        loading={sessions.isPending}
        error={sessions.error}
        onRetry={() => void sessions.refetch()}
        activeId={chat.sessionId}
        onSelect={(id) => void chat.select(id)}
        onDelete={(id) => chat.remove.mutate(id)}
        onNewChat={chat.newChat}
      />

      <BottomSheet visible={renameOpen} onClose={() => setRenameOpen(false)} title="Chat umbenennen">
        <TextField label="Titel" value={title} onChangeText={setTitle} placeholder="Titel festlegen …" />
        {chat.rename.error ? (
          <AppText color={colors.destructive} accessibilityRole="alert">
            {chat.rename.error.message}
          </AppText>
        ) : null}
        <Button
          label="Speichern"
          loading={chat.rename.isPending}
          disabled={!title.trim()}
          onPress={() => chat.rename.mutate(title.trim(), { onSuccess: () => setRenameOpen(false) })}
        />
      </BottomSheet>

      <SaveWordSheet message={saving} sessionId={chat.sessionId} onClose={() => setSaving(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, gap: spacing.sm },
  headerButton: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, paddingBottom: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  starter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: 40 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH,
    maxHeight: 140,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    fontSize: 16,
    backgroundColor: colors.background,
  },
  send: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
