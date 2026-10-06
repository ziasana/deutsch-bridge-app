import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppText } from './AppText';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Taller panel for forms (the keyboard pushes it up). */
  tall?: boolean;
  children: ReactNode;
};

/** Modal panel anchored to the bottom: tap the backdrop, the close button or use the system back to dismiss. */
export function BottomSheet({ visible, onClose, title, tall, children }: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Schließen"
          style={styles.backdrop}
          onPress={onClose}
        />
        <View style={[styles.sheet, tall && { maxHeight: '90%' }]} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="heading" style={styles.title} accessibilityRole="header">
              {title ?? ''}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Schließen"
              onPress={onClose}
              style={styles.close}
            >
              <AppText variant="subheading" color={colors.primaryDark}>
                Schließen
              </AppText>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(29,36,51,0.35)',
  },
  sheet: {
    maxHeight: '65%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { flex: 1 },
  close: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  content: { gap: spacing.md, paddingBottom: spacing.lg },
});
