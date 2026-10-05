import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheet, Button, ErrorState, LoadingState } from '@/components/ui';
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
  const groups = groupSessionsByDate(sessions ?? []);

  const confirmDelete = (s: ChatSession) =>
    Alert.alert(`„${s.title || 'Chat'}“ löschen?`, 'Der gesamte Chat wird gelöscht.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => onDelete(s.id) },
    ]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Unterhaltungen">
      <Button label="＋ Neuer Chat" onPress={() => { onNewChat(); onClose(); }} />
      {loading ? <LoadingState label="Unterhaltungen werden geladen …" /> : null}
      {error ? <ErrorState error={error} onRetry={onRetry} /> : null}
      {!loading && !error && groups.length === 0 ? (
        <AppText color={colors.mutedForeground}>Noch keine Unterhaltungen.</AppText>
      ) : null}
      {groups.map((g) => (
        <View key={g.key} style={{ gap: spacing.xs }}>
          <AppText variant="caption" color={colors.mutedForeground}>
            {g.label.toUpperCase()}
          </AppText>
          {g.sessions.map((s) => (
            <View key={s.id} style={[styles.row, s.id === activeId && styles.active]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={s.title || 'Chat'}
                accessibilityState={{ selected: s.id === activeId }}
                onPress={() => {
                  onSelect(s.id);
                  onClose();
                }}
                style={styles.title}
              >
                <AppText numberOfLines={1}>{s.title || 'Neuer Chat'}</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${s.title || 'Chat'} löschen`}
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
