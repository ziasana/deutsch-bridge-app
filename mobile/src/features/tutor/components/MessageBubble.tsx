import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { ChatMessage } from '@/types/chat';

type Props = { message: ChatMessage; onSaveWord?: (message: ChatMessage) => void };

export function MessageBubble({ message, onSaveWord }: Props) {
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
      <View style={{ flex: 1, gap: spacing.xs, alignItems: 'flex-start' }}>
        <View style={[styles.bubble, styles.tutor]} accessibilityLabel="Antwort des Tutors">
          <RichContent content={message.content} />
        </View>
        {onSaveWord ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Wort aus dieser Antwort speichern"
            onPress={() => onSaveWord(message)}
            style={styles.save}
          >
            <Ionicons name="bookmark-outline" size={16} color={colors.primaryDark} />
            <AppText variant="small" color={colors.primaryDark} style={{ fontWeight: '600' }}>
              Wort speichern
            </AppText>
          </Pressable>
        ) : null}
      </View>
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
  user: { maxWidth: '85%', backgroundColor: colors.brand, borderBottomRightRadius: 6 },
  tutor: { backgroundColor: '#F1F5FB', borderTopLeftRadius: 6 },
  save: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
});
