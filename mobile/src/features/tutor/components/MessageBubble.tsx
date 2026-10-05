import { Pressable, StyleSheet, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import { AppText } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
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
        <AppText>✨</AppText>
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
            <AppText variant="small" color={colors.primaryDark}>
              💾 Wort speichern
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
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  user: { maxWidth: '85%', backgroundColor: colors.primary, borderTopRightRadius: radius.sm },
  tutor: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: radius.sm },
  save: { minHeight: MIN_TOUCH - 8, justifyContent: 'center', paddingHorizontal: spacing.sm },
});
