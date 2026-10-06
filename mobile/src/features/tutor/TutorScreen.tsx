import { AiUsageHint } from '@/features/aiUsage/AiUsageHint';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  BottomSheet,
  Button,
  ErrorState,
  FocusedLightStatusBar,
  HeroArt,
  LoadingState,
  TextField,
} from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { ChatMessage } from '@/types/chat';
import { MessageBubble } from './components/MessageBubble';
import { SaveWordSheet } from './components/SaveWordSheet';
import { SessionsSheet } from './components/SessionsSheet';
import { STARTERS } from './groups';
import { useChatSessions, useTutorChat } from './hooks';

const STARTER_COLORS = ['#3F86F0', '#7B61D9', '#2E8B57', '#E8832E'];

/** Tappable conversation starters shown in the white sheet before the first message. */
function EmptyChat({ onStarter }: { onStarter: (prompt: string) => void }) {
  return (
    <ScrollView
      contentContainerStyle={styles.empty}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <AppText style={styles.sheetTitle} center accessibilityRole="header">
        Womit möchtest du starten?
      </AppText>
      <View style={styles.starterGrid}>
        {STARTERS.map((s, i) => {
          const color = STARTER_COLORS[i % STARTER_COLORS.length];
          return (
            <Pressable
              key={s.key}
              accessibilityRole="button"
              accessibilityLabel={`${s.title}: ${s.description}`}
              onPress={() => onStarter(s.prompt)}
              style={({ pressed }) => [
                styles.starter,
                {
                  borderColor: `${color}55`,
                  backgroundColor: pressed ? `${color}22` : `${color}0F`,
                },
              ]}
            >
              <View style={[styles.starterIcon, { backgroundColor: `${color}26` }]}>
                <AppText style={{ fontSize: 26, lineHeight: 34 }}>{s.emoji}</AppText>
              </View>
              <AppText style={styles.starterTitle}>{s.title}</AppText>
              <AppText variant="small" color={colors.mutedForeground}>
                {s.description}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText variant="small" color={colors.mutedForeground} center>
        Oder schreibe einfach deine erste Nachricht …
      </AppText>
    </ScrollView>
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
    <View style={styles.root}>
      <FocusedLightStatusBar />
      <SafeAreaView edges={['top']} style={styles.top}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Unterhaltungen anzeigen"
            onPress={() => setHistoryOpen(true)}
            style={styles.headerButton}
          >
            <Ionicons name="menu" size={24} color={colors.ink} />
          </Pressable>
          <AppText
            style={styles.headerTitle}
            color="#FFFFFF"
            numberOfLines={1}
            center
            accessibilityRole="header"
          >
            {active?.title || 'AI Tutor'}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Neuer Chat"
            onPress={chat.newChat}
            style={styles.headerButton}
          >
            <Ionicons name="add" size={26} color={colors.ink} />
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
              style={styles.actionPill}
            >
              <AppText variant="small" color="#FFFFFF" style={styles.actionText}>
                Umbenennen
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chat löschen"
              onPress={confirmDeleteActive}
              style={styles.actionPill}
            >
              <AppText variant="small" color="#FFE1DC" style={styles.actionText}>
                Löschen
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {showEmpty ? (
          <View style={styles.hero}>
            <View style={styles.heroText}>
              <AppText style={styles.heroTitle} color="#FFFFFF">
                Guten Tag! 👋
              </AppText>
              <AppText style={styles.heroSub} color="#FFFFFF">
                Ich bin dein Deutsch-Tutor. Übe Deutsch, stelle Fragen oder schreibe einfach mit
                mir.
              </AppText>
            </View>
            <HeroArt icon="chatbubbles" />
          </View>
        ) : null}
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
              <MessageBubble
                message={item}
                onSaveWord={item.role === 'assistant' ? setSaving : undefined}
              />
            )}
            contentContainerStyle={styles.list}
            ListFooterComponent={
              <View style={{ gap: spacing.md }}>
                {chat.thinking ? (
                  <View
                    style={styles.thinking}
                    accessibilityLabel="Der Tutor denkt nach"
                    accessibilityLiveRegion="polite"
                  >
                    <ActivityIndicator color={colors.primary} />
                    <AppText color={colors.mutedForeground}>Der Tutor denkt nach …</AppText>
                  </View>
                ) : null}
                {chat.error ? (
                  <ErrorState
                    error={chat.error.error}
                    onRetry={
                      chat.error.question
                        ? () => void chat.send(chat.error!.question, { resend: true })
                        : undefined
                    }
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
            <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
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

      <BottomSheet
        visible={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Chat umbenennen"
      >
        <TextField
          label="Titel"
          value={title}
          onChangeText={setTitle}
          placeholder="Titel festlegen …"
        />
        {chat.rename.error ? (
          <AppText color={colors.destructive} accessibilityRole="alert">
            {chat.rename.error.message}
          </AppText>
        ) : null}
        <Button
          label="Speichern"
          loading={chat.rename.isPending}
          disabled={!title.trim()}
          onPress={() =>
            chat.rename.mutate(title.trim(), { onSuccess: () => setRenameOpen(false) })
          }
        />
      </BottomSheet>

      <SaveWordSheet message={saving} sessionId={chat.sessionId} onClose={() => setSaving(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brand },
  top: { backgroundColor: colors.brand },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D2433',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerTitle: { flex: 1, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  actionPill: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
  },
  actionText: { fontWeight: '700' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  heroText: { flex: 1, gap: spacing.sm, paddingRight: spacing.md },
  heroTitle: { fontSize: 28, lineHeight: 36, fontWeight: '800' },
  heroSub: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink },
  list: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg, flexGrow: 1 },
  empty: { flexGrow: 1, gap: spacing.lg, padding: spacing.xl, paddingTop: spacing.xl },
  starterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  starter: {
    width: '48%',
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  starterIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  starterTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700', color: colors.ink },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: 40 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 140,
    paddingHorizontal: spacing.xl,
    paddingTop: 15,
    paddingBottom: 15,
    borderRadius: 26,
    color: colors.foreground,
    fontSize: 16,
    backgroundColor: '#F1F5FB',
  },
  send: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
