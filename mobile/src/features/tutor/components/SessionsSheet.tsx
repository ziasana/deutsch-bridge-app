import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheet, Button, ErrorState, LoadingState } from '@/components/ui';
import { useI18n } from '@/i18n';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { ChatSession } from '@/types/chat';
import { groupSessionsByDate } from '../groups';

type Props = {
  visible: boolean;
  onClose: () => void;
  sessions: ChatSession[] | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  activeId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
};

/** The conversation history, grouped by day; tap to open, ✕ to delete (after confirming). */
export function SessionsSheet({
  visible,
  onClose,
  sessions,
  loading,
  error,
  onRetry,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
}: Props) {
  const { t } = useI18n();
  const w = t.tutor;
  const groups = groupSessionsByDate(sessions ?? []);

  const confirmDelete = (s: ChatSession) =>
    Alert.alert(w.deleteTitle(s.title || w.chatFallback), w.deleteMessage, [
      { text: w.cancel, style: 'cancel' },
      { text: w.delete, style: 'destructive', onPress: () => onDelete(s.id) },
    ]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={w.conversations}>
      <Button
        label={w.newChatButton}
        onPress={() => {
          onNewChat();
          onClose();
        }}
      />
      {loading ? <LoadingState label={w.loadingConversations} /> : null}
      {error ? <ErrorState error={error} onRetry={onRetry} /> : null}
      {!loading && !error && groups.length === 0 ? (
        <AppText color={colors.mutedForeground}>{w.noConversations}</AppText>
      ) : null}
      {groups.map((g) => (
        <View key={g.key} style={{ gap: spacing.xs }}>
          <AppText variant="caption" color={colors.mutedForeground}>
            {w.groups[g.key].toUpperCase()}
          </AppText>
          {g.sessions.map((s) => (
            <View key={s.id} style={[styles.row, s.id === activeId && styles.active]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={s.title || w.chatFallback}
                accessibilityState={{ selected: s.id === activeId }}
                onPress={() => {
                  onSelect(s.id);
                  onClose();
                }}
                style={styles.title}
              >
                <AppText numberOfLines={1}>{s.title || w.newChatTitle}</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={w.deleteNamed(s.title || w.chatFallback)}
                onPress={() => confirmDelete(s)}
                style={styles.delete}
              >
                <AppText color={colors.destructive}>✕</AppText>
              </Pressable>
            </View>
          ))}
        </View>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md },
  active: { backgroundColor: colors.accent },
  title: { flex: 1, minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: spacing.md },
  delete: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
});
